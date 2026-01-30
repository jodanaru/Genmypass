/**
 * Tipos para OAuth 2.0 con PKCE (Google Drive, SPA).
 */

/** Code verifier (43–128 caracteres, [A-Za-z0-9._~-]). */
export type CodeVerifier = string;

/** Code challenge (base64url del SHA-256 del verifier). */
export type CodeChallenge = string;

/** Par de PKCE para el flujo de autorización. */
export interface PKCEPair {
  verifier: CodeVerifier;
  challenge: CodeChallenge;
}

/** Código de autorización devuelto por Google en el callback. */
export type AuthCode = string;

/** Token de estado para CSRF (opcional pero recomendado). */
export type State = string;

/** Respuesta del endpoint de tokens de Google. */
export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type: "Bearer";
}

/** Respuesta del endpoint /api/auth/refresh (nuevo access token). */
export interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: "Bearer";
}

/** Error devuelto por el endpoint de tokens o en el callback. */
export interface OAuthErrorResponse {
  error: string;
  error_description?: string;
}

/** Resultado del callback: tokens o error. */
export type OAuthCallbackResult =
  | { success: true; tokens: GoogleTokenResponse }
  | { success: false; error: string; errorDescription?: string };
