/**
 * Cifrado simétrico AES-256-GCM con Web Crypto API.
 * Autenticado (AEAD); uso de AAD opcional.
 */

import type { Ciphertext, DecryptOptions, EncryptOptions } from "./types.js";
import { IV_LENGTH, GCM_TAG_LENGTH, randomBytes } from "./utils.js";

const ALGORITHM = "AES-GCM";
const KEY_LENGTH_BITS = 256;

/**
 * Importa una clave cruda (32 bytes) como CryptoKey para AES-GCM.
 */
async function importKey(key: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    key,
    { name: ALGORITHM, length: KEY_LENGTH_BITS },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Cifra plaintext con AES-256-GCM.
 * IV se genera aleatoriamente y se devuelve en el resultado.
 */
export async function encrypt(options: EncryptOptions): Promise<Ciphertext> {
  const { key, plaintext, additionalData } = options;
  const iv = randomBytes(IV_LENGTH);
  const cryptoKey = await importKey(key);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: GCM_TAG_LENGTH * 8,
      additionalData,
    },
    cryptoKey,
    plaintext
  );

  const ct = new Uint8Array(ciphertext);
  const tag = ct.slice(-GCM_TAG_LENGTH);
  const data = ct.slice(0, -GCM_TAG_LENGTH);

  return { iv, tag, data };
}

/**
 * Descifra un Ciphertext con AES-256-GCM.
 */
export async function decrypt(options: DecryptOptions): Promise<Uint8Array> {
  const { key, ciphertext, additionalData } = options;
  const { iv, tag, data } = ciphertext;
  const cryptoKey = await importKey(key);

  const combined = new Uint8Array(data.length + tag.length);
  combined.set(data);
  combined.set(tag, data.length);

  const plaintext = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: GCM_TAG_LENGTH * 8,
      additionalData,
    },
    cryptoKey,
    combined
  );

  return new Uint8Array(plaintext);
}
