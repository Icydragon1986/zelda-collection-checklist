import type { CollectionSnapshot } from "@/store/useCollection";
import type { CollectionFieldPath } from "@/lib/syncEvents";

export interface FieldClock {
  counter: number;
  deviceId: string;
}

export interface SyncDocument {
  version: 1;
  counter: number;
  values: Record<string, boolean>;
  clocks: Record<string, FieldClock>;
}

const GAME_KEYS = new Set(["cartridge", "manual", "box", "cib"]);
const AMIIBO_KEYS = new Set(["figure", "box", "cib"]);

export function encodeFieldPath(path: CollectionFieldPath): string {
  return JSON.stringify(path);
}

function decodeFieldPath(value: string): CollectionFieldPath | undefined {
  try {
    const path = JSON.parse(value) as unknown;
    if (!Array.isArray(path) || typeof path[0] !== "string" || typeof path[1] !== "string") return undefined;
    if (path[0] === "consoles" && path.length === 2) return path as CollectionFieldPath;
    if (path[0] === "games" && path.length === 3 && typeof path[2] === "string" && GAME_KEYS.has(path[2])) return path as CollectionFieldPath;
    if (path[0] === "amiibo" && path.length === 3 && typeof path[2] === "string" && AMIIBO_KEYS.has(path[2])) return path as CollectionFieldPath;
  } catch {
    // An invalid remote path is ignored by the collection mapper and rejected by validation.
  }
  return undefined;
}

function flattenSnapshot(snapshot: CollectionSnapshot, trueOnly: boolean): Record<string, boolean> {
  const values: Record<string, boolean> = {};
  for (const [id, ownership] of Object.entries(snapshot.games)) {
    for (const key of ["cartridge", "manual", "box", "cib"] as const) {
      const value = Boolean(ownership[key]);
      if (!trueOnly || value) values[encodeFieldPath(["games", id, key])] = value;
    }
  }
  for (const [id, ownership] of Object.entries(snapshot.amiibo)) {
    for (const key of ["figure", "box", "cib"] as const) {
      const value = Boolean(ownership[key]);
      if (!trueOnly || value) values[encodeFieldPath(["amiibo", id, key])] = value;
    }
  }
  for (const [id, owned] of Object.entries(snapshot.consoles)) {
    const value = Boolean(owned);
    if (!trueOnly || value) values[encodeFieldPath(["consoles", id])] = value;
  }
  return values;
}

function nextClock(counter: number, deviceId: string): FieldClock {
  return { counter: counter + 1, deviceId };
}

export function createSyncDocument(snapshot: CollectionSnapshot, deviceId: string, trueOnly = false, startCounter = 0): SyncDocument {
  const values = flattenSnapshot(snapshot, trueOnly);
  const clocks: Record<string, FieldClock> = {};
  let counter = startCounter;
  for (const path of Object.keys(values).sort()) {
    const clock = nextClock(counter, deviceId);
    counter = clock.counter;
    clocks[path] = clock;
  }
  return { version: 1, counter, values, clocks };
}

export function validateSyncDocument(value: unknown): SyncDocument {
  if (!value || typeof value !== "object") throw new Error("invalid-sync-document");
  const document = value as Partial<SyncDocument>;
  if (document.version !== 1 || !Number.isSafeInteger(document.counter) || (document.counter ?? -1) < 0) throw new Error("invalid-sync-document");
  if (!document.values || typeof document.values !== "object" || !document.clocks || typeof document.clocks !== "object") throw new Error("invalid-sync-document");
  const paths = Object.keys(document.values);
  if (paths.length > 20_000 || Object.keys(document.clocks).length !== paths.length) throw new Error("invalid-sync-document");
  let highestClock = 0;
  for (const path of paths) {
    const clock = document.clocks[path];
    if (!decodeFieldPath(path) || typeof document.values[path] !== "boolean" || !clock
      || !Number.isSafeInteger(clock.counter) || clock.counter < 1 || typeof clock.deviceId !== "string" || !clock.deviceId) {
      throw new Error("invalid-sync-document");
    }
    highestClock = Math.max(highestClock, clock.counter);
  }
  if ((document.counter as number) < highestClock) throw new Error("invalid-sync-document");
  return document as SyncDocument;
}

function compareClocks(left: FieldClock, right: FieldClock): number {
  if (left.counter !== right.counter) return left.counter - right.counter;
  return left.deviceId.localeCompare(right.deviceId);
}

export function mergeSyncDocuments(left: SyncDocument, right: SyncDocument): SyncDocument {
  const values: Record<string, boolean> = {};
  const clocks: Record<string, FieldClock> = {};
  for (const path of new Set([...Object.keys(left.values), ...Object.keys(right.values)])) {
    const leftClock = left.clocks[path];
    const rightClock = right.clocks[path];
    const useRight = !leftClock || (rightClock && compareClocks(rightClock, leftClock) > 0);
    const source = useRight ? right : left;
    values[path] = source.values[path];
    clocks[path] = source.clocks[path];
  }
  return { version: 1, counter: Math.max(left.counter, right.counter), values, clocks };
}

export function updateSyncField(document: SyncDocument, path: CollectionFieldPath, value: boolean, deviceId: string): SyncDocument {
  const encodedPath = encodeFieldPath(path);
  const clock = nextClock(document.counter, deviceId);
  return {
    version: 1,
    counter: clock.counter,
    values: { ...document.values, [encodedPath]: value },
    clocks: { ...document.clocks, [encodedPath]: clock },
  };
}

export function replaceSyncDocument(document: SyncDocument, snapshot: CollectionSnapshot, deviceId: string): SyncDocument {
  const snapshotValues = flattenSnapshot(snapshot, false);
  const paths = new Set([...Object.keys(document.values), ...Object.keys(snapshotValues)]);
  let result = document;
  for (const path of [...paths].sort()) {
    const decoded = decodeFieldPath(path);
    if (decoded) result = updateSyncField(result, decoded, snapshotValues[path] ?? false, deviceId);
  }
  return result;
}

export function applySyncDocument(snapshot: CollectionSnapshot, document: SyncDocument): CollectionSnapshot {
  const games = Object.fromEntries(Object.entries(snapshot.games).map(([id, ownership]) => [id, { ...ownership }]));
  const amiibo = Object.fromEntries(Object.entries(snapshot.amiibo).map(([id, ownership]) => [id, { ...ownership }]));
  const consoles = { ...snapshot.consoles };

  for (const [encodedPath, value] of Object.entries(document.values)) {
    const path = decodeFieldPath(encodedPath);
    if (!path) continue;
    if (path[0] === "games") {
      const [, id, key] = path;
      const current = games[id] ?? { cartridge: false, manual: false, box: false, cib: false };
      games[id] = { ...current, [key]: value };
    } else if (path[0] === "amiibo") {
      const [, id, key] = path;
      const current = amiibo[id] ?? { figure: false, box: false, cib: false };
      amiibo[id] = { ...current, [key]: value };
    } else {
      consoles[path[1]] = value;
    }
  }
  return { games, amiibo, consoles };
}

export function syncDocumentsEqual(left: SyncDocument, right: SyncDocument): boolean {
  const leftPaths = Object.keys(left.values);
  const rightPaths = Object.keys(right.values);
  if (leftPaths.length !== rightPaths.length) return false;
  return leftPaths.every((path) => {
    const leftClock = left.clocks[path];
    const rightClock = right.clocks[path];
    return right.values[path] === left.values[path] && !!rightClock
      && rightClock.counter === leftClock.counter && rightClock.deviceId === leftClock.deviceId;
  });
}

export function snapshotHasOwnedItems(snapshot: CollectionSnapshot): boolean {
  return Object.values(flattenSnapshot(snapshot, true)).some(Boolean);
}
