/**
 * Gestión de refresh token cifrado y auto-refresh del access token.
 * Cifrado AES-256-GCM con master key; persistencia en localStorage; refresh 5 min antes de expirar.
 */

import { encrypt, decrypt } from "@/lib/crypto/encryption";
import { stringToBytes, bytesToString, toBase64, fromBase64, concat } from "@/lib/crypto/utils";
import { IV_LENGTH, GCM_TAG_LENGTH } from "@/lib/crypto/utils";
import type { TokenResponse } from "./types.js";

const STORAGE_KEY = "ert";
const REFRESH_BEFORE_MS = 5 * 60 * 1000; // 5 min antes de expirar
const REFRESH_ENDPOINT = "/api/auth/refresh";

/** Estado interno: access token actual y momento de expiración. */
let currentAccessToken: string | null = null;
let expiresAt: number | null = null;
let refreshTimerId: ReturnType<typeof setTimeout> | null = null;

/**
 * Cifra el refresh token con la master key (AES-256-GCM).
 * Retorna una única string en base64: iv (12) + tag (16) + ciphertext.
 */
export async function encryptRefreshToken(
  refreshToken: string,
  masterKey: Uint8Array
): Promise<string> {
  const plaintext = stringToBytes(refreshToken);
  const { iv, tag, data } = await encrypt({ key: masterKey, plaintext });
  const combined = concat(iv, tag, data);
  return toBase64(combined);
}

/**
 * Descifra un refresh token previamente cifrado con encryptRefreshToken.
 */
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

/**
 * Guarda el refresh token cifrado en localStorage (key: 'ert').
 */
export function storeRefreshToken(encrypted: string): void {
  localStorage.setItem(STORAGE_KEY, encrypted);
}

/**
 * Lee el refresh token cifrado de localStorage.
 */
export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Llama al backend /api/auth/refresh con el refresh token y devuelve el nuevo access token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const base =
    import.meta.env.VITE_OAUTH_PROXY_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");
  const url = `${base}${REFRESH_ENDPOINT}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string; message?: string };
    throw new Error(err.error ?? err.message ?? `Refresh failed: ${response.status}`);
  }

  const data = (await response.json()) as TokenResponse;
  if (!data.access_token || data.token_type !== "Bearer") {
    throw new Error("Respuesta de refresh inválida");
  }
  return data;
}

/**
 * Actualiza el access token y la hora de expiración en memoria.
 * Debe llamarse tras OAuth callback o tras un refresh exitoso.
 */
export function setTokens(tokens: TokenResponse): void {
  currentAccessToken = tokens.access_token;
  expiresAt = Date.now() + tokens.expires_in * 1000;
}

/**
 * Devuelve el access token actual (o null si no hay ninguno).
 */
export function getAccessToken(): string | null {
  return currentAccessToken;
}

/**
 * Devuelve el timestamp (ms) en que expira el access token, o null.
 */
export function getExpiresAt(): number | null {
  return expiresAt;
}

/**
 * Programa el auto-refresh 5 min antes de que expire el access token.
 * Requiere que ya se haya llamado setTokens y que exista un refresh token cifrado en localStorage.
 * Usa masterKey para descifrar el refresh token cuando toque refrescar.
 */
export function startAutoRefresh(masterKey: Uint8Array): void {
  stopAutoRefresh();
  const encrypted = getStoredRefreshToken();
  if (!encrypted || expiresAt === null) return;

  const refreshAt = expiresAt - REFRESH_BEFORE_MS;
  const delay = Math.max(0, refreshAt - Date.now());

  refreshTimerId = setTimeout(async () => {
    refreshTimerId = null;
    try {
      const refreshToken = await decryptRefreshToken(encrypted, masterKey);
      const tokens = await refreshAccessToken(refreshToken);
      setTokens(tokens);
      startAutoRefresh(masterKey); // programa el siguiente
    } catch {
      // Fallo silencioso; el usuario tendrá que re-autenticarse
    }
  }, delay);
}

/**
 * Cancela el timer de auto-refresh.
 */
export function stopAutoRefresh(): void {
  if (refreshTimerId !== null) {
    clearTimeout(refreshTimerId);
    refreshTimerId = null;
  }
}
