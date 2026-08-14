export type CollectionFieldPath = ["games", string, "cartridge" | "manual" | "box" | "cib"]
  | ["amiibo", string, "figure" | "box" | "cib"]
  | ["consoles", string];

export type CollectionSyncChange =
  | { kind: "field"; path: CollectionFieldPath; value: boolean }
  | { kind: "replace" };

export const COLLECTION_SYNC_CHANGE_EVENT = "triforce:collection-sync-change";

export function notifyCollectionFieldChange(path: CollectionFieldPath, value: boolean): void {
  window.dispatchEvent(new CustomEvent<CollectionSyncChange>(COLLECTION_SYNC_CHANGE_EVENT, {
    detail: { kind: "field", path, value },
  }));
}

export function notifyCollectionReplaced(): void {
  window.dispatchEvent(new CustomEvent<CollectionSyncChange>(COLLECTION_SYNC_CHANGE_EVENT, {
    detail: { kind: "replace" },
  }));
}
