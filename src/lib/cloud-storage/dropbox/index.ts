import { OAuthProxyError } from "@/lib/api-errors";
import type {
  CloudFile,
  CloudProvider,
  CloudStorageProvider,
  OAuthResult,
  TokenResponse,
} from "../types.js";
import * as oauth from "./oauth.js";
import * as api from "./api.js";

function getOAuthProxyBase(): string {
  return (
    import.meta.env.VITE_OAUTH_PROXY_URL ??
    (typeof window !== "undefined" ? window.location.origin : "")
  );
}

export class DropboxProvider implements CloudStorageProvider {
  readonly name: CloudProvider = "dropbox";

  async initiateOAuth(verifier: string): Promise<void> {
    await oauth.initiateDropboxOAuth(verifier);
  }

  async handleOAuthCallback(): Promise<OAuthResult> {
    return oauth.handleDropboxCallback();
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const base = getOAuthProxyBase();
    const response = await fetch(`${base}/api/auth/dropbox/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) {
      const err = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      const message =
        err.error ?? err.message ?? `Refresh failed: ${response.status}`;
      throw new OAuthProxyError(message, response.status);
    }
    const data = (await response.json()) as TokenResponse;
    if (!data.access_token) {
      throw new Error("Respuesta de refresh inválida");
    }
    return data;
  }

  async findVaultFile(): Promise<CloudFile | null> {
    return api.findVaultFile();
  }

  async createVaultFile(content: string): Promise<string> {
    return api.createVaultFile(content);
  }

  async readVaultFile(fileId: string): Promise<string> {
    return api.readVaultFile(fileId);
  }

  async updateVaultFile(fileId: string, content: string): Promise<void> {
    return api.updateVaultFile(fileId, content);
  }

  async deleteVaultFile(fileId: string): Promise<void> {
    return api.deleteVaultFile(fileId);
  }

  async getUserEmail(): Promise<string | null> {
    return api.getUserEmail();
  }
}
