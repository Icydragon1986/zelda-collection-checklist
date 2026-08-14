const DATABASE_NAME = "triforce-checklist";
const STORE_NAME = "custom-covers";
const MARKER_PREFIX = "web-cover:";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = run(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

export function isWebCoverMarker(value: string): boolean {
  return value.startsWith(MARKER_PREFIX);
}

export async function saveWebCover(id: string, file: File): Promise<string> {
  await withStore("readwrite", (store) => store.put(file, id));
  return `${MARKER_PREFIX}${id}`;
}

export async function loadWebCover(marker: string): Promise<string | undefined> {
  const id = marker.slice(MARKER_PREFIX.length);
  const blob = await withStore<Blob | undefined>("readonly", (store) => store.get(id));
  return blob ? URL.createObjectURL(blob) : undefined;
}

export async function deleteWebCover(marker: string): Promise<void> {
  const id = marker.slice(MARKER_PREFIX.length);
  await withStore("readwrite", (store) => store.delete(id));
}
