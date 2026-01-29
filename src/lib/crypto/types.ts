/**
 * Tipos para el módulo crypto zero-knowledge.
 * Cifrado AES-256-GCM y KDF Argon2id.
 */

/** Sal para Argon2id (16 bytes recomendados). */
export type Salt = Uint8Array;

/** IV/nonce para AES-GCM (12 bytes). */
export type IV = Uint8Array;

/** Clave derivada (32 bytes para AES-256). */
export type DerivedKey = Uint8Array;

/** Parámetros de derivación Argon2id. */
export interface Argon2Params {
  /** Memoria en KiB (ej. 65536 = 64 MiB). */
  memLimit: number;
  /** Iteraciones (ej. 2). */
  opsLimit: number;
  /** Longitud de la clave derivada en bytes (32 para AES-256). */
  outputLen: number;
}

/** Resultado del KDF: clave + sal (para persistir la sal). */
export interface KDFResult {
  key: DerivedKey;
  salt: Salt;
}

/** Ciphertext: IV (12) + tag (16) + ciphertext. */
export interface Ciphertext {
  iv: IV;
  tag: Uint8Array;
  data: Uint8Array;
}

/** Opciones de cifrado. */
export interface EncryptOptions {
  /** Clave de 32 bytes (AES-256). */
  key: DerivedKey;
  /** Datos en claro. */
  plaintext: Uint8Array;
  /** AAD opcional (authenticated additional data). */
  additionalData?: Uint8Array;
}

/** Opciones de descifrado. */
export interface DecryptOptions {
  key: DerivedKey;
  ciphertext: Ciphertext;
  additionalData?: Uint8Array;
}
