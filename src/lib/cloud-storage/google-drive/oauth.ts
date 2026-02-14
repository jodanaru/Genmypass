/**
 * OAuth 2.0 con PKCE para Google Drive (SPA). Scope: drive.appdata.
 */
import { toBase64 } from "@/lib/crypto/utils";
import { generateState } from "../pkce.js";
import type { OAuthResult, TokenResponse } from "../types.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPE =
  "https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.email";

const STORAGE_VERIFIER = "google_oauth_code_verifier";
const STORAGE_STATE = "google_oauth_state";

export const OAUTH_CALLBACK_PATH = "/auth/callback";

function getOAuthProxyBase(): string {
  return (
    import.meta.env.VITE_OAUTH_PROXY_URL ??
    (typeof window !== "undefined" ? window.location.origin : "")
  );
}

async function computeCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return toBase64(new Uint8Array(hash));
}

function getClientId(): string {
  const id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!id || typeof id !== "string") {
    throw new Error("VITE_GOOGLE_CLIENT_ID no está definida");
  }
  return id;
}

export async function initiateOAuthFlow(verifier: string): Promise<void> {
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
    access_type: "offline",
    prompt: "consent",
  });

  window.location.href = `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function handleOAuthCallback(): Promise<OAuthResult> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
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
      status: response.status,
    };
  }

  const tokens = data as TokenResponse;
  if (!tokens.access_token || tokens.token_type !== "Bearer") {
    return {
      success: false,
      error: "invalid_response",
      errorDescription: "La respuesta del servidor de tokens no es válida",
    };
  }

  return { success: true, tokens };
}
