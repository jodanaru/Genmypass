/**
 * Gestión de refresh token cifrado y auto-refresh del access token (compartido entre proveedores).
 * Cifrado AES-256-GCM con master key; persistencia en localStorage; refresh 5 min antes de expirar.
 */

import { encrypt, decrypt } from "@/lib/crypto/encryption";
import {
  stringToBytes,
  bytesToString,
  toBase64,
  fromBase64,
  concat,
  IV_LENGTH,
  GCM_TAG_LENGTH,
} from "@/lib/crypto/utils";
import type { CloudStorageProvider, TokenResponse } from "./types.js";

const STORAGE_KEY = "ert";
const REFRESH_BEFORE_MS = 5 * 60 * 1000; // 5 min antes de expirar

let currentAccessToken: string | null = null;
let expiresAt: number | null = null;
let refreshTimerId: ReturnType<typeof setTimeout> | null = null;

export async function encryptRefreshToken(
  refreshToken: string,
  masterKey: Uint8Array
): Promise<string> {
  const plaintext = stringToBytes(refreshToken);
  const { iv, tag, data } = await encrypt({ key: masterKey, plaintext });
  const combined = concat(iv, tag, data);
  return toBase64(combined);
}

export async function decryptRefreshToken(
  encrypted: string,
  masterKey: Uint8Array
): Promise<string> {
  const combined = fromBase64(encrypted);
  if (combined.length < IV_LENGTH + GCM_TAG_LENGTH) {
    throw new Error("Datos cifrados inválidos (longitud insuficiente)");
  }
  const iv = combined.slice(0, IV_LENGTH);
  const tag = combined.slice(IV_LENGTH, IV_LENGTH + GCM_TAG_LENGTH);
  const data = combined.slice(IV_LENGTH + GCM_TAG_LENGTH);
  const plaintext = await decrypt({
    key: masterKey,
    ciphertext: { iv, tag, data },
  });
  return bytesToString(plaintext);
}

export function storeRefreshToken(encrypted: string): void {
  localStorage.setItem(STORAGE_KEY, encrypted);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setTokens(tokens: TokenResponse): void {
  currentAccessToken = tokens.access_token;
  expiresAt = Date.now() + tokens.expires_in * 1000;
}

export function getAccessToken(): string | null {
  return currentAccessToken;
}

export function getExpiresAt(): number | null {
  return expiresAt;
}

/**
 * Programa el auto-refresh usando el proveedor actual para renovar el token.
 */
export function startAutoRefresh(
  masterKey: Uint8Array,
  provider: CloudStorageProvider
): void {
  stopAutoRefresh();
  const encrypted = getStoredRefreshToken();
  if (!encrypted || expiresAt === null) return;

  const refreshAt = expiresAt - REFRESH_BEFORE_MS;
  const delay = Math.max(0, refreshAt - Date.now());

  refreshTimerId = setTimeout(async () => {
    refreshTimerId = null;
    try {
      const refreshToken = await decryptRefreshToken(encrypted, masterKey);
      const tokens = await provider.refreshAccessToken(refreshToken);
      setTokens(tokens);
      startAutoRefresh(masterKey, provider);
    } catch {
      // Fallo silencioso; el usuario tendrá que re-autenticarse
    }
  }, delay);
}

export function stopAutoRefresh(): void {
  if (refreshTimerId !== null) {
    clearTimeout(refreshTimerId);
    refreshTimerId = null;
  }
}

/**
 * Intenta restaurar la sesión usando el refresh token cifrado en localStorage.
 * Útil cuando se abre una nueva pestaña (sessionStorage vacío) pero el refresh
 * token sigue disponible en localStorage cifrado con la master key.
 * Devuelve true si se restauró correctamente, false en caso contrario.
 */
export async function tryRestoreWithRefreshToken(
  masterKey: Uint8Array,
  provider: CloudStorageProvider
): Promise<boolean> {
  // Si ya tenemos un access token válido, no hace falta refrescar
  if (getAccessToken()) return true;

  const encrypted = getStoredRefreshToken();
  if (!encrypted) return false;

  try {
    const refreshToken = await decryptRefreshToken(encrypted, masterKey);
    const tokens = await provider.refreshAccessToken(refreshToken);
    setTokens(tokens);
    startAutoRefresh(masterKey, provider);
    return true;
  } catch {
    return false;
  }
}

export function clearSessionTokens(): void {
  stopAutoRefresh();
  currentAccessToken = null;
  expiresAt = null;
}
