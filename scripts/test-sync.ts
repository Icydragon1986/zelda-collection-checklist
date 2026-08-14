import assert from "node:assert/strict";
import {
  createPairingUrl,
  decodePairingBundle,
  decryptSyncPayload,
  encodePairingBundle,
  encryptSyncPayload,
  generateEncryptionKey,
  pairingBundleFromInput,
} from "../src/lib/syncCrypto.ts";
import {
  applySyncDocument,
  createSyncDocument,
  mergeSyncDocuments,
  updateSyncField,
} from "../src/lib/syncDocument.ts";

const emptyCollection = () => ({ games: {}, amiibo: {}, consoles: {} });

async function run(): Promise<void> {
  const desktop = createSyncDocument(emptyCollection(), "desktop");
  const desktopWithGame = updateSyncField(desktop, ["games", "oot-na", "cib"], true, "desktop");
  const iphoneWithConsole = updateSyncField(desktop, ["consoles", "n64-na"], true, "iphone");
  const independentMerge = mergeSyncDocuments(desktopWithGame, iphoneWithConsole);
  const mergedCollection = applySyncDocument(emptyCollection(), independentMerge);

  assert.equal(mergedCollection.games["oot-na"].cib, true, "La modification Windows doit être conservée.");
  assert.equal(mergedCollection.consoles["n64-na"], true, "La modification iPhone doit être conservée.");

  const unchecked = updateSyncField(desktopWithGame, ["games", "oot-na", "cib"], false, "desktop");
  const uncheckMerge = mergeSyncDocuments(desktopWithGame, unchecked);
  assert.equal(applySyncDocument(emptyCollection(), uncheckMerge).games["oot-na"].cib, false, "Une case décochée doit se propager.");

  const sameClockLeft = updateSyncField(desktop, ["consoles", "switch-na"], true, "device-a");
  const sameClockRight = updateSyncField(desktop, ["consoles", "switch-na"], false, "device-b");
  const leftRight = mergeSyncDocuments(sameClockLeft, sameClockRight);
  const rightLeft = mergeSyncDocuments(sameClockRight, sameClockLeft);
  assert.deepEqual(leftRight, rightLeft, "Une égalité doit être résolue de façon déterministe.");

  const key = generateEncryptionKey();
  const encrypted = await encryptSyncPayload(independentMerge, key);
  assert.ok(encrypted.startsWith("v1."), "Le format chiffré doit être versionné.");
  assert.equal(encrypted.includes("oot-na"), false, "Le contenu ne doit pas apparaître en clair.");
  assert.deepEqual(await decryptSyncPayload(encrypted, key), independentMerge, "Le document chiffré doit pouvoir être relu.");

  const bundle = {
    v: 1 as const,
    endpoint: "https://zelda.icydragon1986.com/checklist",
    token: "test-token-that-is-longer-than-thirty-two-characters",
    key,
  };
  assert.deepEqual(decodePairingBundle(encodePairingBundle(bundle)), bundle, "Le code d’appairage doit être réversible.");
  assert.deepEqual(pairingBundleFromInput(createPairingUrl(bundle)), bundle, "Le lien QR doit contenir le bon appairage.");

  console.log("Synchronisation valide : fusion, décochage, chiffrement et appairage.");
}

await run();
