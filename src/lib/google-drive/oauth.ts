/**
 * OAuth 2.0 con PKCE para Google Drive (SPA, sin client_secret).
 * Scope: drive.appdata.
 */

import { randomBytes, toBase64 } from "@/lib/crypto/utils";
import type {
  AuthCode,
  CodeChallenge,
  CodeVerifier,
  GoogleTokenResponse,
  OAuthCallbackResult,
  PKCEPair,
  State,
} from "./types.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPE = "https://www.googleapis.com/auth/drive.appdata";

function getOAuthProxyBase(): string {
  return (
    import.meta.env.VITE_OAUTH_PROXY_URL ??
    (typeof window !== "undefined" ? window.location.origin : "")
  );
}

/** Longitud del code_verifier en bytes (RFC 7636: 43–128 caracteres; 32 bytes → 43 chars base64url). */
const CODE_VERIFIER_BYTES = 32;

/** Claves en sessionStorage. */
const STORAGE_VERIFIER = "google_oauth_code_verifier";
const STORAGE_STATE = "google_oauth_state";

/** Ruta del callback en la app (debe coincidir con la configurada en Google Cloud Console). */
export const OAUTH_CALLBACK_PATH = "/auth/callback";

function getClientId(): string {
  const id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!id || typeof id !== "string") {
    throw new Error("VITE_GOOGLE_CLIENT_ID no está definida");
  }
  return id;
}

/**
 * Genera code_verifier y code_challenge (S256) para PKCE.
 */
export async function generatePKCE(): Promise<PKCEPair> {
  const verifierBytes = randomBytes(CODE_VERIFIER_BYTES);
  const verifier: CodeVerifier = toBase64(verifierBytes);
  const challenge: CodeChallenge = await computeCodeChallenge(verifier);
  return { verifier, challenge };
}

async function computeCodeChallenge(verifier: CodeVerifier): Promise<CodeChallenge> {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return toBase64(new Uint8Array(hash));
}

/**
 * Genera un state aleatorio para CSRF.
 */
function generateState(): State {
  return toBase64(randomBytes(24));
}

/**
 * Redirige al usuario a Google OAuth con PKCE.
 * Guarda code_verifier y state en sessionStorage para el callback.
 */
export async function initiateOAuthFlow(verifier: CodeVerifier): Promise<void> {
  const clientId = getClientId();
  const challenge = await computeCodeChallenge(verifier);
  const state = generateState();

  sessionStorage.setItem(STORAGE_VERIFIER, verifier);
  sessionStorage.setItem(STORAGE_STATE, state);

  const redirectUri = `${window.location.origin}${OAUTH_CALLBACK_PATH}`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  });

  window.location.href = `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Procesa el callback de Google: lee code y state de la URL,
 * recupera el code_verifier de sessionStorage, intercambia code por tokens
 * y limpia sessionStorage.
 */
export async function handleOAuthCallback(): Promise<OAuthCallbackResult> {
  const params = new URLSearchParams(window.location.search);
  const code: AuthCode | null = params.get("code");
  const stateFromUrl = params.get("state");
  const error = params.get("error");
  const errorDescription = params.get("error_description");

  if (error) {
    return {
      success: false,
      error,
      errorDescription: errorDescription ?? undefined,
    };
  }

  const storedState = sessionStorage.getItem(STORAGE_STATE);
  const verifier = sessionStorage.getItem(STORAGE_VERIFIER);

  if (!storedState || !verifier) {
    return {
      success: false,
      error: "missing_storage",
      errorDescription: "Falta code_verifier o state en sessionStorage (¿caducó la sesión?)",
    };
  }

  if (stateFromUrl !== storedState) {
    sessionStorage.removeItem(STORAGE_VERIFIER);
    sessionStorage.removeItem(STORAGE_STATE);
    return {
      success: false,
      error: "invalid_state",
      errorDescription: "El state no coincide (posible CSRF)",
    };
  }

  if (!code) {
    return {
      success: false,
      error: "missing_code",
      errorDescription: "Google no devolvió un código de autorización",
    };
  }

  const redirectUri = `${window.location.origin}${OAUTH_CALLBACK_PATH}`;

  const response = await fetch(`${getOAuthProxyBase()}/api/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      code_verifier: verifier,
      redirect_uri: redirectUri,
    }),
  });

  sessionStorage.removeItem(STORAGE_VERIFIER);
  sessionStorage.removeItem(STORAGE_STATE);

  const data = await response.json();

  if (!response.ok) {
    const err = data as { error?: string; error_description?: string };
    return {
      success: false,
      error: err.error ?? "token_request_failed",
      errorDescription: err.error_description,
    };
  }

  const tokens = data as GoogleTokenResponse;
  if (!tokens.access_token || tokens.token_type !== "Bearer") {
    return {
      success: false,
      error: "invalid_response",
      errorDescription: "La respuesta del servidor de tokens no es válida",
    };
  }

  return { success: true, tokens };
}
