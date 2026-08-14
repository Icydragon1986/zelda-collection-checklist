import { create } from "zustand";
import { useCollection, type CollectionSnapshot } from "@/store/useCollection";
import {
  createPairingUrl,
  createPairingQrValue,
  decryptSyncPayload,
  encryptSyncPayload,
  generateEncryptionKey,
  normalizeSyncEndpoint,
  pairingBundleFromHash,
  pairingBundleFromInput,
  randomId,
  validatePairingBundle,
  type PairingBundle,
} from "@/lib/syncCrypto";
import {
  applySyncDocument,
  createSyncDocument,
  mergeSyncDocuments,
  replaceSyncDocument,
  snapshotHasOwnedItems,
  syncDocumentsEqual,
  updateSyncField,
  validateSyncDocument,
  type SyncDocument,
} from "@/lib/syncDocument";
import {
  COLLECTION_SYNC_CHANGE_EVENT,
  type CollectionSyncChange,
} from "@/lib/syncEvents";

export type SyncStatus = "off" | "pending" | "connecting" | "synced" | "offline" | "error";

interface PersistedSyncConfig {
  version: 1;
  endpoint: string;
  token: string;
  encryptionKey: string;
  deviceId: string;
  revision: number;
  document?: SyncDocument;
  lastSyncedAt?: string;
}

interface RemoteSnapshot {
  revision: number;
  payload: string | null;
  deviceId: string;
  updatedAt: string;
}

interface SyncState {
  initialized: boolean;
  configured: boolean;
  endpoint: string;
  status: SyncStatus;
  errorCode?: string;
  lastSyncedAt?: string;
  pairingUrl?: string;
  pairingQrValue?: string;
  initialize: () => Promise<void>;
  configure: (endpoint: string, token: string) => Promise<void>;
  pairFromLink: (value: string) => Promise<void>;
  syncNow: () => Promise<void>;
  disconnect: () => void;
}

const STORAGE_KEY = "triforce-checklist:sync-v1";
const STORAGE_DATABASE = "triforce-checklist-private-sync";
const STORAGE_OBJECT_STORE = "configuration";
const STORAGE_RECORD_KEY = "active";
const DEFAULT_ENDPOINT = "https://zelda.icydragon1986.com/checklist";
const REQUEST_TIMEOUT_MS = 12_000;

let activeConfig: PersistedSyncConfig | undefined;
let initializationPromise: Promise<void> | undefined;
let synchronizationPromise: Promise<void> | undefined;
let syncAgain = false;
let listenersInstalled = false;
let delayedSync: number | undefined;
let periodicSync: number | undefined;
let runtimeInstanceId: string | undefined;
let backupQueue: Promise<void> = Promise.resolve();

class SyncRequestError extends Error {
  constructor(public readonly code: string, public readonly status?: number) {
    super(code);
  }
}

function currentCollection(): CollectionSnapshot {
  const state = useCollection.getState();
  return { games: state.games, amiibo: state.amiibo, consoles: state.consoles };
}

function clockDeviceId(config: PersistedSyncConfig): string {
  runtimeInstanceId ??= randomId();
  return `${config.deviceId}:${runtimeInstanceId}`;
}

function pairingUrl(config: PersistedSyncConfig): string {
  return createPairingUrl(pairingBundle(config));
}

function pairingQrValue(config: PersistedSyncConfig): string {
  return createPairingQrValue(pairingBundle(config));
}

function pairingBundle(config: PersistedSyncConfig): PairingBundle {
  return {
    v: 1,
    endpoint: config.endpoint,
    token: config.token,
    key: config.encryptionKey,
  };
}

function openStorageDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(STORAGE_DATABASE, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORAGE_OBJECT_STORE)) {
        request.result.createObjectStore(STORAGE_OBJECT_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function writeBackup(serialized?: string): Promise<void> {
  if (!("indexedDB" in window)) return;
  const database = await openStorageDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORAGE_OBJECT_STORE, "readwrite");
      const store = transaction.objectStore(STORAGE_OBJECT_STORE);
      if (serialized) store.put(serialized, STORAGE_RECORD_KEY);
      else store.delete(STORAGE_RECORD_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

async function readBackup(): Promise<string | undefined> {
  if (!("indexedDB" in window)) return undefined;
  const database = await openStorageDatabase();
  try {
    return await new Promise<string | undefined>((resolve, reject) => {
      const transaction = database.transaction(STORAGE_OBJECT_STORE, "readonly");
      const request = transaction.objectStore(STORAGE_OBJECT_STORE).get(STORAGE_RECORD_KEY);
      request.onsuccess = () => resolve(typeof request.result === "string" ? request.result : undefined);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

function queueBackup(serialized?: string): void {
  backupQueue = backupQueue
    .then(() => writeBackup(serialized))
    .catch((error) => console.warn("Sauvegarde secondaire de la synchronisation impossible.", error));
}

function requestPersistentStorage(): void {
  if (!navigator.storage?.persist) return;
  void navigator.storage.persist().catch(() => false);
}

function saveConfig(): void {
  if (!activeConfig) {
    localStorage.removeItem(STORAGE_KEY);
    queueBackup();
    return;
  }
  const serialized = JSON.stringify(activeConfig);
  localStorage.setItem(STORAGE_KEY, serialized);
  queueBackup(serialized);
}

function updateVisibleState(): void {
  useSync.setState(activeConfig ? {
    configured: true,
    endpoint: activeConfig.endpoint,
    lastSyncedAt: activeConfig.lastSyncedAt,
    pairingUrl: pairingUrl(activeConfig),
    pairingQrValue: pairingQrValue(activeConfig),
  } : {
    configured: false,
    endpoint: DEFAULT_ENDPOINT,
    status: "off",
    errorCode: undefined,
    lastSyncedAt: undefined,
    pairingUrl: undefined,
    pairingQrValue: undefined,
  });
}

async function loadConfig(): Promise<PersistedSyncConfig | undefined> {
  let raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    try {
      raw = await readBackup() ?? null;
      if (raw) localStorage.setItem(STORAGE_KEY, raw);
    } catch (error) {
      console.warn("Récupération secondaire de la synchronisation impossible.", error);
    }
  }
  if (!raw) return undefined;
  try {
    const value = JSON.parse(raw) as Partial<PersistedSyncConfig>;
    if (value.version !== 1 || typeof value.endpoint !== "string" || typeof value.token !== "string"
      || typeof value.encryptionKey !== "string" || typeof value.deviceId !== "string"
      || !Number.isSafeInteger(value.revision) || (value.revision ?? -1) < 0) throw new Error("invalid-sync-config");
    const bundle = validatePairingBundle({ v: 1, endpoint: value.endpoint, token: value.token, key: value.encryptionKey });
    return {
      version: 1,
      endpoint: bundle.endpoint,
      token: bundle.token,
      encryptionKey: bundle.key,
      deviceId: value.deviceId,
      revision: value.revision as number,
      document: value.document ? validateSyncDocument(value.document) : undefined,
      lastSyncedAt: typeof value.lastSyncedAt === "string" ? value.lastSyncedAt : undefined,
    };
  } catch (error) {
    console.error("Configuration de synchronisation invalide.", error);
    localStorage.removeItem(STORAGE_KEY);
    queueBackup();
    return undefined;
  }
}

function installPairingBundle(bundle: PairingBundle): void {
  const validated = validatePairingBundle(bundle);
  activeConfig = {
    version: 1,
    endpoint: validated.endpoint,
    token: validated.token,
    encryptionKey: validated.key,
    deviceId: randomId(),
    revision: 0,
  };
  saveConfig();
  requestPersistentStorage();
  updateVisibleState();
}

async function requestJson(url: string, token: string, init: RequestInit = {}): Promise<{ response: Response; body: unknown }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new SyncRequestError("invalid-server-response", response.status);
    }
    return { response, body };
  } catch (error) {
    if (error instanceof SyncRequestError) throw error;
    if (!navigator.onLine) throw new SyncRequestError("offline");
    throw new SyncRequestError(error instanceof DOMException && error.name === "AbortError" ? "timeout" : "unreachable");
  } finally {
    window.clearTimeout(timeout);
  }
}

function parseRemoteSnapshot(value: unknown): RemoteSnapshot {
  if (!value || typeof value !== "object") throw new SyncRequestError("invalid-server-response");
  const snapshot = value as Partial<RemoteSnapshot>;
  if (!Number.isSafeInteger(snapshot.revision) || (snapshot.revision ?? -1) < 0
    || (snapshot.payload !== null && typeof snapshot.payload !== "string")
    || typeof snapshot.deviceId !== "string" || typeof snapshot.updatedAt !== "string") {
    throw new SyncRequestError("invalid-server-response");
  }
  return snapshot as RemoteSnapshot;
}

async function fetchRemoteSnapshot(endpoint: string, token: string): Promise<RemoteSnapshot> {
  const { response, body } = await requestJson(`${endpoint}/v1/snapshot`, token);
  if (response.status === 401) throw new SyncRequestError("unauthorized", 401);
  if (!response.ok) throw new SyncRequestError("server-error", response.status);
  return parseRemoteSnapshot(body);
}

async function putRemoteSnapshot(config: PersistedSyncConfig, document: SyncDocument, baseRevision: number): Promise<RemoteSnapshot> {
  const payload = await encryptSyncPayload(document, config.encryptionKey);
  const { response, body } = await requestJson(`${config.endpoint}/v1/snapshot`, config.token, {
    method: "PUT",
    body: JSON.stringify({ baseRevision, payload, deviceId: config.deviceId }),
  });
  if (response.status === 409) throw new SyncRequestError("revision-conflict", 409);
  if (response.status === 401) throw new SyncRequestError("unauthorized", 401);
  if (!response.ok) throw new SyncRequestError("server-error", response.status);
  const result = body as Partial<RemoteSnapshot>;
  if (!Number.isSafeInteger(result.revision) || typeof result.updatedAt !== "string") throw new SyncRequestError("invalid-server-response");
  return {
    revision: result.revision as number,
    payload,
    deviceId: config.deviceId,
    updatedAt: result.updatedAt,
  };
}

function applyDocumentToCollection(document: SyncDocument): void {
  const before = currentCollection();
  const after = applySyncDocument(before, document);
  if (JSON.stringify(before) !== JSON.stringify(after)) useCollection.getState().applySyncedSnapshot(after);
}

function markSynchronized(config: PersistedSyncConfig, revision: number): void {
  config.revision = revision;
  config.lastSyncedAt = new Date().toISOString();
  saveConfig();
  useSync.setState({
    status: "synced",
    errorCode: undefined,
    lastSyncedAt: config.lastSyncedAt,
    pairingUrl: pairingUrl(config),
    pairingQrValue: pairingQrValue(config),
  });
}

async function performSynchronization(): Promise<void> {
  const sessionDeviceId = activeConfig?.deviceId;
  if (!activeConfig || !sessionDeviceId) return;
  useSync.setState({ status: "connecting", errorCode: undefined });

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const config = activeConfig;
    if (!config || config.deviceId !== sessionDeviceId) return;
    try {
      const remote = await fetchRemoteSnapshot(config.endpoint, config.token);
      let merged: SyncDocument;
      let remoteDocument: SyncDocument | undefined;

      if (remote.payload) {
        remoteDocument = validateSyncDocument(await decryptSyncPayload(remote.payload, config.encryptionKey));
        if (config.document) {
          merged = mergeSyncDocuments(config.document, remoteDocument);
        } else if (snapshotHasOwnedItems(currentCollection())) {
          merged = mergeSyncDocuments(
            remoteDocument,
            createSyncDocument(currentCollection(), clockDeviceId(config), true, remoteDocument.counter),
          );
        } else {
          merged = remoteDocument;
        }
      } else {
        merged = config.document ?? createSyncDocument(currentCollection(), clockDeviceId(config));
      }

      config.document = merged;
      config.revision = remote.revision;
      applyDocumentToCollection(merged);
      saveConfig();

      if (remoteDocument && syncDocumentsEqual(merged, remoteDocument)) {
        markSynchronized(config, remote.revision);
        return;
      }

      const documentToPush = config.document;
      const result = await putRemoteSnapshot(config, documentToPush, remote.revision);
      markSynchronized(config, result.revision);
      return;
    } catch (error) {
      if (error instanceof SyncRequestError && error.code === "revision-conflict") continue;
      throw error;
    }
  }
  throw new SyncRequestError("too-many-conflicts");
}

async function synchronize(): Promise<void> {
  if (!activeConfig) return;
  if (synchronizationPromise) {
    syncAgain = true;
    return synchronizationPromise;
  }
  synchronizationPromise = performSynchronization()
    .catch((error) => {
      const code = error instanceof SyncRequestError ? error.code : error instanceof Error ? error.message : "unknown";
      console.error("Synchronisation impossible.", error);
      useSync.setState({ status: code === "offline" || code === "unreachable" || code === "timeout" ? "offline" : "error", errorCode: code });
    })
    .finally(() => {
      synchronizationPromise = undefined;
      if (syncAgain) {
        syncAgain = false;
        void synchronize();
      }
    });
  return synchronizationPromise;
}

function scheduleSync(delay = 800): void {
  if (delayedSync) window.clearTimeout(delayedSync);
  delayedSync = window.setTimeout(() => {
    delayedSync = undefined;
    void synchronize();
  }, delay);
}

function handleCollectionChange(event: Event): void {
  if (!activeConfig) return;
  const detail = (event as CustomEvent<CollectionSyncChange>).detail;
  if (!detail) return;
  const writerId = clockDeviceId(activeConfig);
  const document = activeConfig.document ?? createSyncDocument(currentCollection(), writerId);
  activeConfig.document = detail.kind === "field"
    ? updateSyncField(document, detail.path, detail.value, writerId)
    : replaceSyncDocument(document, currentCollection(), writerId);
  saveConfig();
  useSync.setState({ status: "pending", errorCode: undefined });
  scheduleSync();
}

function installAutomaticListeners(): void {
  if (listenersInstalled) return;
  listenersInstalled = true;
  window.addEventListener(COLLECTION_SYNC_CHANGE_EVENT, handleCollectionChange);
  window.addEventListener("online", () => scheduleSync(100));
  window.addEventListener("focus", () => scheduleSync(250));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") scheduleSync(100);
  });
  periodicSync = window.setInterval(() => { if (activeConfig) void synchronize(); }, 60_000);
}

async function initializeSync(): Promise<void> {
  if (initializationPromise) return initializationPromise;
  initializationPromise = (async () => {
    installAutomaticListeners();
    try {
      const bundle = pairingBundleFromHash(window.location.hash);
      if (bundle) {
        const english = document.documentElement.lang === "en";
        const accepted = window.confirm(english
          ? "Pair this device with your private Triforce Checklist sync?"
          : "Appairer cet appareil avec ta synchronisation privée Triforce Checklist?");
        if (accepted) installPairingBundle(bundle);
        else {
          activeConfig = await loadConfig();
          updateVisibleState();
        }
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      } else {
        activeConfig = await loadConfig();
        updateVisibleState();
      }
      useSync.setState({ initialized: true });
      if (activeConfig) await synchronize();
    } catch (error) {
      const code = error instanceof Error ? error.message : "invalid-pairing";
      useSync.setState({ initialized: true, status: "error", errorCode: code });
    }
  })();
  return initializationPromise;
}

async function configureSync(endpointValue: string, tokenValue: string): Promise<void> {
  useSync.setState({ status: "connecting", errorCode: undefined });
  try {
    const endpoint = normalizeSyncEndpoint(endpointValue);
    const token = tokenValue.trim();
    if (token.length < 32) throw new SyncRequestError("invalid-token");
    const remote = await fetchRemoteSnapshot(endpoint, token);
    if (remote.payload) throw new SyncRequestError("server-already-initialized");
    activeConfig = {
      version: 1,
      endpoint,
      token,
      encryptionKey: generateEncryptionKey(),
      deviceId: randomId(),
      revision: remote.revision,
    };
    activeConfig.document = createSyncDocument(currentCollection(), clockDeviceId(activeConfig));
    saveConfig();
    requestPersistentStorage();
    updateVisibleState();
    await synchronize();
  } catch (error) {
    const code = error instanceof SyncRequestError ? error.code : error instanceof Error ? error.message : "unknown";
    useSync.setState({ status: code === "offline" || code === "unreachable" || code === "timeout" ? "offline" : "error", errorCode: code });
    throw error;
  }
}

async function pairFromLink(value: string): Promise<void> {
  useSync.setState({ status: "connecting", errorCode: undefined });
  try {
    installPairingBundle(pairingBundleFromInput(value));
    await synchronize();
  } catch (error) {
    const code = error instanceof SyncRequestError ? error.code : error instanceof Error ? error.message : "invalid-pairing";
    useSync.setState({ status: code === "offline" || code === "unreachable" || code === "timeout" ? "offline" : "error", errorCode: code });
    throw error;
  }
}

function disconnectSync(): void {
  activeConfig = undefined;
  if (delayedSync) window.clearTimeout(delayedSync);
  delayedSync = undefined;
  saveConfig();
  updateVisibleState();
}

export const useSync = create<SyncState>(() => ({
  initialized: false,
  configured: false,
  endpoint: DEFAULT_ENDPOINT,
  status: "off",
  initialize: initializeSync,
  configure: configureSync,
  pairFromLink,
  syncNow: synchronize,
  disconnect: disconnectSync,
}));

// Kept alive for the lifetime of the page; exposed only to make intentional cleanup explicit.
void periodicSync;
