/**
 * Limpieza completa de datos del vault y sesión.
 * Usado al eliminar el vault para que la raíz (/) muestre la landing como usuario nuevo.
 */

/** Claves de localStorage usadas por Genmypass (incl. Zustand persist y token cifrado). */
const LOCAL_KEYS = [
  "genmypass_vault_file_id",
  "genmypass_salt",
  "genmypass_force_new_setup",
  "genmypass_cloud_provider",
  "genmypass_oauth_complete",
  "genmypass_setup_step",
  "genmypass_setup_complete",
  "genmypass_has_secret_key",
  "genmypass_user_email",
  "genmypass_security_mode",
  "genmypass-settings", // Zustand persist
  "ert", // encrypted refresh token
] as const;

/** Claves de sessionStorage usadas por Genmypass (incl. OAuth). */
const SESSION_KEYS = [
  "genmypass_access_token",
  "genmypass_token_expires_at",
  "genmypass_temp_refresh",
  "genmypass_just_setup",
  "genmypass_vault_file_to_delete",
  "google_oauth_code_verifier",
  "google_oauth_state",
  "dropbox_oauth_verifier",
  "dropbox_oauth_state",
] as const;

/**
 * Elimina todas las claves de Genmypass en localStorage y sessionStorage.
 * Llamar junto a clearSessionTokens(), vaultStore.clear() y lock() al borrar el vault.
 */
export function clearAllGenmypassStorage(): void {
  if (typeof localStorage !== "undefined") {
    for (const key of LOCAL_KEYS) {
      localStorage.removeItem(key);
    }
  }
  if (typeof sessionStorage !== "undefined") {
    for (const key of SESSION_KEYS) {
      sessionStorage.removeItem(key);
    }
  }
}
