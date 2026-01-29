/**
 * Módulo crypto zero-knowledge: Argon2id (KDF) + AES-256-GCM.
 * - kdf: derivación de clave desde contraseña maestra.
 * - encryption: cifrado/descifrado autenticado.
 */

export * from "./types.js";
export * from "./utils.js";
export {
  initSodium,
  deriveKey,
  deriveKeyWithNewSalt,
  DEFAULT_argon2_PARAMS,
} from "./kdf.js";
export { encrypt, decrypt } from "./encryption.js";
