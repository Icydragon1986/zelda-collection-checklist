const PAIRING_APP_URL = "https://icydragon1986.github.io/zelda-collection-checklist/";

export interface PairingBundle {
  v: 1;
  endpoint: string;
  token: string;
  key: string;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function requireCrypto(): Crypto {
  if (!globalThis.crypto?.subtle) throw new Error("crypto-unavailable");
  return globalThis.crypto;
}

export function randomId(): string {
  const cryptoApi = requireCrypto();
  if (typeof cryptoApi.randomUUID === "function") return cryptoApi.randomUUID();
  const bytes = cryptoApi.getRandomValues(new Uint8Array(18));
  return bytesToBase64Url(bytes);
}

export function generateEncryptionKey(): string {
  return bytesToBase64Url(requireCrypto().getRandomValues(new Uint8Array(32)));
}

async function importEncryptionKey(encodedKey: string): Promise<CryptoKey> {
  const bytes = base64UrlToBytes(encodedKey);
  if (bytes.byteLength !== 32) throw new Error("invalid-encryption-key");
  return requireCrypto().subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptSyncPayload(value: unknown, encodedKey: string): Promise<string> {
  const cryptoApi = requireCrypto();
  const iv = cryptoApi.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await cryptoApi.subtle.encrypt({ name: "AES-GCM", iv }, await importEncryptionKey(encodedKey), plaintext);
  return `v1.${bytesToBase64Url(iv)}.${bytesToBase64Url(new Uint8Array(ciphertext))}`;
}

export async function decryptSyncPayload<T>(payload: string, encodedKey: string): Promise<T> {
  const [version, encodedIv, encodedCiphertext, extra] = payload.split(".");
  if (version !== "v1" || !encodedIv || !encodedCiphertext || extra) throw new Error("invalid-encrypted-payload");
  try {
    const plaintext = await requireCrypto().subtle.decrypt(
      { name: "AES-GCM", iv: base64UrlToBytes(encodedIv) },
      await importEncryptionKey(encodedKey),
      base64UrlToBytes(encodedCiphertext),
    );
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } catch {
    throw new Error("wrong-encryption-key");
  }
}

export function normalizeSyncEndpoint(value: string): string {
  const url = new URL(value.trim());
  const localDevelopment = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(localDevelopment && url.protocol === "http:")) throw new Error("invalid-endpoint");
  if (url.username || url.password || url.search || url.hash) throw new Error("invalid-endpoint");
  return url.href.replace(/\/$/, "");
}

export function validatePairingBundle(value: unknown): PairingBundle {
  if (!value || typeof value !== "object") throw new Error("invalid-pairing");
  const bundle = value as Partial<PairingBundle>;
  if (bundle.v !== 1 || typeof bundle.endpoint !== "string" || typeof bundle.token !== "string" || typeof bundle.key !== "string") {
    throw new Error("invalid-pairing");
  }
  const endpoint = normalizeSyncEndpoint(bundle.endpoint);
  if (bundle.token.length < 32 || base64UrlToBytes(bundle.key).byteLength !== 32) throw new Error("invalid-pairing");
  return { v: 1, endpoint, token: bundle.token, key: bundle.key };
}

export function encodePairingBundle(bundle: PairingBundle): string {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(validatePairingBundle(bundle))));
}

export function decodePairingBundle(encoded: string): PairingBundle {
  try {
    return validatePairingBundle(JSON.parse(new TextDecoder().decode(base64UrlToBytes(encoded))));
  } catch {
    throw new Error("invalid-pairing");
  }
}

export function createPairingUrl(bundle: PairingBundle): string {
  return `${PAIRING_APP_URL}#pair=${encodeURIComponent(encodePairingBundle(bundle))}`;
}

export function pairingBundleFromHash(hash: string): PairingBundle | undefined {
  const match = /^#pair=([^&]+)$/.exec(hash);
  return match ? decodePairingBundle(decodeURIComponent(match[1])) : undefined;
}

export function pairingBundleFromInput(value: string): PairingBundle {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("invalid-pairing");
  try {
    const url = new URL(trimmed);
    const bundle = pairingBundleFromHash(url.hash);
    if (bundle) return bundle;
  } catch {
    // The input may be the encoded pairing code without the surrounding URL.
  }
  return decodePairingBundle(trimmed.replace(/^#?pair=/, ""));
}
