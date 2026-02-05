/**
 * Utilidades criptográficas: codificación, aleatoriedad, constantes.
 */

/** Longitud del IV para AES-GCM (12 bytes). */
export const IV_LENGTH = 12;

/** Longitud del tag de autenticación GCM (16 bytes). */
export const GCM_TAG_LENGTH = 16;

/** Longitud de la clave AES-256 (32 bytes). */
export const KEY_LENGTH = 32;

/** Longitud recomendada de la sal para Argon2id (16 bytes). */
export const SALT_LENGTH = 16;

/**
 * Genera bytes aleatorios criptográficamente seguros.
 */
export function randomBytes(length: number): Uint8Array {
  const buf = new Uint8Array(length);
  crypto.getRandomValues(buf);
  return buf;
}

/**
 * Codifica Uint8Array a base64 (URL-safe, sin padding).
 */
export function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Decodifica base64 (URL-safe) a Uint8Array.
 */
export function fromBase64(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Concatena varios Uint8Array.
 */
export function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((acc, a) => acc + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

/**
 * Convierte string a Uint8Array (UTF-8).
 */
export function stringToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/**
 * Convierte Uint8Array a string (UTF-8).
 */
export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Comparación en tiempo constante de dos Uint8Array (misma longitud).
 * Evita ataques de timing al no hacer short-circuit.
 */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}
