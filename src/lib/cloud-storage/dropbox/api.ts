/**
 * Dropbox API v2 - Operaciones en App Folder (vault.json).
 * Docs: https://www.dropbox.com/developers/documentation/http/documentation
 */
import { getAccessToken } from "../token-manager.js";
import type { CloudFile } from "../types.js";

const DROPBOX_API_BASE = "https://api.dropboxapi.com/2";
const DROPBOX_CONTENT_BASE = "https://content.dropboxapi.com/2";
const VAULT_PATH = "/vault.json";

export class DropboxApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "DropboxApiError";
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  if (!token) {
    throw new DropboxApiError("No hay token de acceso disponible", 401, "no_token");
  }
  return { Authorization: `Bearer ${token}` };
}

async function handleApiError(response: Response): Promise<never> {
  let errorMessage = `Error ${response.status}`;
  let errorCode: string | undefined;
  try {
    const data = (await response.json()) as { error?: unknown };
    if (data?.error && typeof data.error === "object" && data.error !== null) {
      const err = data.error as Record<string, unknown>;
      if (typeof err.error === "string") errorMessage = err.error;
      else errorMessage = JSON.stringify(data.error);
      errorCode = err[".tag"] as string | undefined;
    }
  } catch {
    // ignore
  }
  throw new DropboxApiError(errorMessage, response.status, errorCode);
}

/** Dropbox get_metadata devuelve .tag, name, path_display, id, client_modified, etc. */
interface DropboxFileMetadata {
  ".tag": string;
  name: string;
  id?: string;
  path_display?: string;
  client_modified?: string;
  server_modified?: string;
}

function toCloudFile(meta: DropboxFileMetadata): CloudFile {
  const modifiedTime = meta.server_modified ?? meta.client_modified ?? new Date().toISOString();
  return {
    id: meta.id ?? VAULT_PATH,
    name: meta.name,
    modifiedTime,
  };
}

export async function findVaultFile(): Promise<CloudFile | null> {
  const response = await fetch(`${DROPBOX_API_BASE}/files/get_metadata`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: VAULT_PATH }),
  });

  if (response.status === 409) {
    // path/not_found
    return null;
  }
  if (!response.ok) await handleApiError(response);

  const meta = (await response.json()) as DropboxFileMetadata;
  return toCloudFile(meta);
}

export async function createVaultFile(content: string): Promise<string> {
  const response = await fetch(`${DROPBOX_CONTENT_BASE}/files/upload`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({ path: VAULT_PATH, mode: "add" }),
    },
    body: content,
  });

  if (!response.ok) await handleApiError(response);

  const meta = (await response.json()) as DropboxFileMetadata & { id?: string };
  return meta.id ?? VAULT_PATH;
}

export async function readVaultFile(fileId: string): Promise<string> {
  const path = fileId === VAULT_PATH ? VAULT_PATH : fileId;
  const response = await fetch(`${DROPBOX_CONTENT_BASE}/files/download`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Dropbox-API-Arg": JSON.stringify({ path }),
    },
  });

  if (!response.ok) await handleApiError(response);
  return response.text();
}

export async function updateVaultFile(fileId: string, content: string): Promise<void> {
  const path = fileId === VAULT_PATH ? VAULT_PATH : fileId;
  const response = await fetch(`${DROPBOX_CONTENT_BASE}/files/upload`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({ path, mode: "overwrite" }),
    },
    body: content,
  });

  if (!response.ok) await handleApiError(response);
}

export async function deleteVaultFile(fileId: string): Promise<void> {
  const path = fileId === VAULT_PATH ? VAULT_PATH : fileId;
  const response = await fetch(`${DROPBOX_API_BASE}/files/delete_v2`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path }),
  });

  if (!response.ok) await handleApiError(response);
}

const GET_CURRENT_ACCOUNT_URL = `${DROPBOX_API_BASE}/users/get_current_account`;

export async function getUserEmail(): Promise<string | null> {
  try {
    const response = await fetch(GET_CURRENT_ACCOUNT_URL, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: "null",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { email?: string };
    return data.email ?? null;
  } catch {
    return null;
  }
}
