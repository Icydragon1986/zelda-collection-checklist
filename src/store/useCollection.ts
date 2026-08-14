import { create } from "zustand";
import { load, type Store } from "@tauri-apps/plugin-store";
import { mkdir, writeFile, remove, BaseDirectory } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";

export interface Ownership {
  cartridge: boolean;
  manual: boolean;
  box: boolean;
  cib: boolean;
}

export const EMPTY_OWNERSHIP: Ownership = { cartridge: false, manual: false, box: false, cib: false };

export interface AmiiboOwnership { figure: boolean; box: boolean; cib: boolean; }
export const EMPTY_AMIIBO_OWNERSHIP: AmiiboOwnership = { figure: false, box: false, cib: false };

export interface AutomaticBackup {
  id: string;
  createdAt: string;
  data: string;
  fingerprint: string;
}

interface CollectionSnapshot {
  games: Record<string, Ownership>;
  amiibo: Record<string, AmiiboOwnership>;
  consoles: Record<string, boolean>;
}

function isAnyOwned(o: Ownership | undefined): boolean {
  return !!o && (o.cartridge || o.manual || o.box || o.cib);
}

function toOwnership(v: unknown): Ownership {
  if (v && typeof v === "object") return { ...EMPTY_OWNERSHIP, ...(v as Partial<Ownership>) };
  return { ...EMPTY_OWNERSHIP };
}

function toAmiiboOwnership(v: unknown): AmiiboOwnership {
  if (typeof v === "boolean") return { ...EMPTY_AMIIBO_OWNERSHIP, figure: v };
  if (v && typeof v === "object") return { ...EMPTY_AMIIBO_OWNERSHIP, ...(v as Partial<AmiiboOwnership>) };
  return { ...EMPTY_AMIIBO_OWNERSHIP };
}

interface CollectionState {
  games: Record<string, Ownership>;
  amiibo: Record<string, AmiiboOwnership>;
  consoles: Record<string, boolean>;
  customCovers: Record<string, string>;
  automaticBackups: AutomaticBackup[];
  ready: boolean;
  getGameOwnership: (id: string) => Ownership;
  isGameOwned: (id: string) => boolean;
  setGameFlag: (id: string, key: keyof Ownership, value: boolean) => void;
  isAmiiboOwned: (id: string) => boolean;
  setAmiiboFlag: (id: string, key: keyof AmiiboOwnership, value: boolean) => void;
  toggleConsole: (id: string) => void;
  setCustomCover: (id: string, file: File) => Promise<void>;
  clearCustomCover: (id: string) => Promise<void>;
  createBackup: () => string;
  restoreBackup: (raw: string) => void;
  restoreAutomaticBackup: (id: string) => void;
  clearAutomaticBackups: () => void;
  init: () => Promise<void>;
}

let storeInstance: Store | null = null;
let automaticBackupTimer: ReturnType<typeof setTimeout> | undefined;
let persistenceQueue = Promise.resolve();

function snapshotToBackup(snapshot: CollectionSnapshot, createdAt = new Date().toISOString()): string {
  return JSON.stringify({
    format: "triforce-checklist",
    version: 1,
    exportedAt: createdAt,
    collection: snapshot,
  }, null, 2);
}

function snapshotFingerprint(snapshot: CollectionSnapshot): string {
  return JSON.stringify(snapshot);
}

function queueStoreWrite(key: string, value: unknown) {
  persistenceQueue = persistenceQueue
    .then(async () => {
      if (!storeInstance) return;
      await storeInstance.set(key, value);
      await storeInstance.save();
    })
    .catch((error) => console.error("Impossible d'enregistrer la collection.", error));
}

function addAutomaticBackup(snapshot: CollectionSnapshot) {
  const fingerprint = snapshotFingerprint(snapshot);
  const current = useCollection.getState().automaticBackups;
  if (current[0]?.fingerprint === fingerprint) return;
  const createdAt = new Date().toISOString();
  const backups: AutomaticBackup[] = [{
    id: `${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt,
    data: snapshotToBackup(snapshot, createdAt),
    fingerprint,
  }, ...current].slice(0, 10);
  useCollection.setState({ automaticBackups: backups });
  queueStoreWrite("automaticBackups", backups);
}

function scheduleAutomaticBackup(snapshot: CollectionSnapshot) {
  if (automaticBackupTimer) clearTimeout(automaticBackupTimer);
  automaticBackupTimer = setTimeout(() => addAutomaticBackup(snapshot), 1200);
}

function persist(state: {
  games: Record<string, Ownership>;
  amiibo: Record<string, AmiiboOwnership>;
  consoles: Record<string, boolean>;
  customCovers: Record<string, string>;
}) {
  queueStoreWrite("collection", state);
  scheduleAutomaticBackup({ games: state.games, amiibo: state.amiibo, consoles: state.consoles });
}

function parseBackup(raw: string): CollectionSnapshot {
  const parsed = JSON.parse(raw) as {
    format?: string;
    version?: number;
    collection?: {
      games?: Record<string, unknown>;
      amiibo?: Record<string, unknown>;
      consoles?: Record<string, boolean>;
    };
  };
  if (parsed.format !== "triforce-checklist" || parsed.version !== 1 || !parsed.collection) {
    throw new Error("invalid-backup");
  }
  return {
    games: Object.fromEntries(Object.entries(parsed.collection.games ?? {}).map(([id, value]) => [id, toOwnership(value)])),
    amiibo: Object.fromEntries(Object.entries(parsed.collection.amiibo ?? {}).map(([id, value]) => [id, toAmiiboOwnership(value)])),
    consoles: Object.fromEntries(Object.entries(parsed.collection.consoles ?? {}).filter(([, value]) => typeof value === "boolean")),
  };
}

export const useCollection = create<CollectionState>((set, get) => ({
  games: {},
  amiibo: {},
  consoles: {},
  customCovers: {},
  automaticBackups: [],
  ready: false,

  getGameOwnership: (id) => get().games[id] ?? EMPTY_OWNERSHIP,
  isGameOwned: (id) => isAnyOwned(get().games[id]),
  isAmiiboOwned: (id) => {
    const own = get().amiibo[id];
    return !!own && (own.figure || own.box || own.cib);
  },

  init: async () => {
    if (storeInstance) return;
    try {
      const store = await load("collection.json", { autoSave: false });
      storeInstance = store;
      const saved = await store.get<{
        games?: Record<string, unknown>;
        amiibo?: Record<string, unknown>;
        consoles?: Record<string, boolean>;
        customCovers?: Record<string, string>;
      }>("collection");
      const storedBackups = await store.get<AutomaticBackup[]>("automaticBackups");
      const games = Object.fromEntries(
        Object.entries(saved?.games ?? {}).map(([id, v]) => [id, toOwnership(v)]),
      );
      const amiibo = Object.fromEntries(Object.entries(saved?.amiibo ?? {}).map(([id, v]) => [id, toAmiiboOwnership(v)]));
      const consoles = saved?.consoles ?? {};
      set({ games, amiibo, consoles, customCovers: saved?.customCovers ?? {}, automaticBackups: Array.isArray(storedBackups) ? storedBackups.slice(0, 10) : [], ready: true });
      scheduleAutomaticBackup({ games, amiibo, consoles });
    } catch (error) {
      console.error("Impossible de charger la collection persistée, démarrage à vide.", error);
      set({ ready: true });
    }
  },

  setGameFlag: (id, key, value) => {
    addAutomaticBackup({ games: get().games, amiibo: get().amiibo, consoles: get().consoles });
    const current = get().games[id] ?? EMPTY_OWNERSHIP;
    const games = { ...get().games, [id]: { ...current, [key]: value } };
    set({ games });
    persist({ games, amiibo: get().amiibo, consoles: get().consoles, customCovers: get().customCovers });
  },

  setAmiiboFlag: (id, key, value) => {
    addAutomaticBackup({ games: get().games, amiibo: get().amiibo, consoles: get().consoles });
    const current = get().amiibo[id] ?? EMPTY_AMIIBO_OWNERSHIP;
    const amiibo = { ...get().amiibo, [id]: { ...current, [key]: value } };
    set({ amiibo });
    persist({ games: get().games, amiibo, consoles: get().consoles, customCovers: get().customCovers });
  },

  toggleConsole: (id) => {
    addAutomaticBackup({ games: get().games, amiibo: get().amiibo, consoles: get().consoles });
    const consoles = { ...get().consoles, [id]: !get().consoles[id] };
    set({ consoles });
    persist({ games: get().games, amiibo: get().amiibo, consoles, customCovers: get().customCovers });
  },

  setCustomCover: async (id, file) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const filename = `${id}.${ext}`;

    await mkdir("covers", { baseDir: BaseDirectory.AppData, recursive: true });
    await writeFile(`covers/${filename}`, bytes, { baseDir: BaseDirectory.AppData });

    const absolutePath = await join(await appDataDir(), "covers", filename);
    const customCovers = { ...get().customCovers, [id]: absolutePath };
    set({ customCovers });
    persist({ games: get().games, amiibo: get().amiibo, consoles: get().consoles, customCovers });
  },

  clearCustomCover: async (id) => {
    const path = get().customCovers[id];
    if (!path) return;
    const customCovers = { ...get().customCovers };
    delete customCovers[id];
    set({ customCovers });
    persist({ games: get().games, amiibo: get().amiibo, consoles: get().consoles, customCovers });
    try {
      await remove(path);
    } catch {
      // Le fichier a peut-être déjà disparu — pas grave, l'entrée du store est déjà nettoyée.
    }
  },

  createBackup: () => snapshotToBackup({ games: get().games, amiibo: get().amiibo, consoles: get().consoles }),

  restoreBackup: (raw) => {
    const { games, amiibo, consoles } = parseBackup(raw);
    addAutomaticBackup({ games: get().games, amiibo: get().amiibo, consoles: get().consoles });
    set({ games, amiibo, consoles });
    persist({ games, amiibo, consoles, customCovers: get().customCovers });
  },

  restoreAutomaticBackup: (id) => {
    const backup = get().automaticBackups.find((item) => item.id === id);
    if (!backup) throw new Error("invalid-backup");
    get().restoreBackup(backup.data);
  },

  clearAutomaticBackups: () => {
    if (automaticBackupTimer) clearTimeout(automaticBackupTimer);
    set({ automaticBackups: [] });
    queueStoreWrite("automaticBackups", []);
  },
}));
