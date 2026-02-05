/**
 * Tipos comunes para la capa de almacenamiento en la nube (Google Drive, Dropbox).
 */

export type CloudProvider = "google-drive" | "dropbox";

export interface CloudFile {
  id: string;
  name: string;
  modifiedTime: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface OAuthResult {
  success: boolean;
  tokens?: TokenResponse;
  error?: string;
  errorDescription?: string;
}

export interface CloudStorageProvider {
  readonly name: CloudProvider;

  /** Inicia el flujo OAuth (redirige al usuario). */
  initiateOAuth(verifier: string): Promise<void>;

  /** Procesa el callback OAuth (code + state) y devuelve tokens o error. */
  handleOAuthCallback(): Promise<OAuthResult>;

  /** Intercambia refresh_token por un nuevo access_token. */
  refreshAccessToken(refreshToken: string): Promise<TokenResponse>;

  /** Busca el archivo vault; null si no existe. */
  findVaultFile(): Promise<CloudFile | null>;

  /** Crea el archivo vault con el contenido; retorna fileId. */
  createVaultFile(content: string): Promise<string>;

  /** Lee el contenido del archivo vault. */
  readVaultFile(fileId: string): Promise<string>;

  /** Actualiza el contenido del archivo vault. */
  updateVaultFile(fileId: string, content: string): Promise<void>;

  /** Elimina el archivo vault. */
  deleteVaultFile(fileId: string): Promise<void>;

  /** Obtiene el email del usuario conectado (para mostrar en Settings). */
  getUserEmail(): Promise<string | null>;
}
