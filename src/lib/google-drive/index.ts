/**
 * Google Drive: OAuth 2.0 con PKCE (SPA, drive.appdata).
 */

export * from "./types.js";
export {
  generatePKCE,
  initiateOAuthFlow,
  handleOAuthCallback,
  OAUTH_CALLBACK_PATH,
} from "./oauth.js";
export {
  encryptRefreshToken,
  decryptRefreshToken,
  storeRefreshToken,
  getStoredRefreshToken,
  refreshAccessToken,
  setTokens,
  getAccessToken,
  getExpiresAt,
  startAutoRefresh,
  stopAutoRefresh,
} from "./token-manager.js";
export {
  findVaultFile,
  createVaultFile,
  readVaultFile,
  updateVaultFile,
  deleteVaultFile,
  getOrCreateVault,
  saveVault,
  DriveApiError,
} from "./drive-api.js";
export type { DriveFile } from "./drive-api.js";
