/**
 * KDF con Argon2id vía libsodium (crypto_pwhash).
 * Usado para derivar una clave de 32 bytes a partir de la contraseña maestra.
 */

import sodium from "libsodium-wrappers-sumo";
import type { Argon2Params, KDFResult, Salt } from "./types.js";
import { SALT_LENGTH } from "./utils.js";

/** Parámetros por defecto: Argon2id, 64 MiB, 2 ops. */
export const DEFAULT_argon2_PARAMS: Argon2Params = {
  memLimit: 65536, // 64 MiB
  opsLimit: 2,
  outputLen: 32,
};

/**
 * Inicializa libsodium (async). Llamar una vez al arranque.
 */
export async function initSodium(): Promise<void> {
  await sodium.ready;
}

/**
 * Deriva una clave de 32 bytes a partir de la contraseña y la sal.
 * Usa Argon2id (crypto_pwhash en libsodium).
 */
export function deriveKey(
  password: string,
  salt: Salt,
  params: Argon2Params = DEFAULT_argon2_PARAMS
): KDFResult {
  const key = sodium.crypto_pwhash(
    params.outputLen,
    password,
    salt,
    params.opsLimit,
    params.memLimit,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );
  return { key, salt };
}

/**
 * Genera una nueva sal y deriva la clave.
 */
export function deriveKeyWithNewSalt(
  password: string,
  params: Argon2Params = DEFAULT_argon2_PARAMS
): KDFResult {
  const salt = sodium.randombytes_buf(SALT_LENGTH);
  return deriveKey(password, salt, params);
}
