/**
 * Google Drive API - CRUD para vault.json en appDataFolder.
 */
import { getAccessToken } from "../token-manager.js";
import type { CloudFile } from "../types.js";

const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";
const VAULT_FILENAME = "vault.json";

interface DriveFileResponse {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

interface FileListResponse {
  files: DriveFileResponse[];
  nextPageToken?: string;
}

export class DriveApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "DriveApiError";
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  if (!token) {
    throw new DriveApiError("No hay token de acceso disponible", 401, "no_token");
  }
  return { Authorization: `Bearer ${token}` };
}

async function handleApiError(response: Response): Promise<never> {
  let errorMessage = `Error ${response.status}`;
  let errorCode: string | undefined;
  try {
    const errorData = (await response.json()) as {
      error?: { message?: string; code?: number };
    };
    errorMessage = errorData.error?.message ?? errorMessage;
    errorCode = errorData.error?.code?.toString();
  } catch {
    // ignore
  }
  throw new DriveApiError(errorMessage, response.status, errorCode);
}

function toCloudFile(f: DriveFileResponse): CloudFile {
  return { id: f.id, name: f.name, modifiedTime: f.modifiedTime };
}

export async function findVaultFile(): Promise<CloudFile | null> {
  const params = new URLSearchParams({
    spaces: "appDataFolder",
    q: `name = '${VAULT_FILENAME}' and trashed = false`,
    fields: "files(id, name, mimeType, modifiedTime)",
  });

  const response = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) await handleApiError(response);

  const data: FileListResponse = await response.json();
  const file = data.files.length > 0 ? data.files[0] ?? null : null;
  return file ? toCloudFile(file) : null;
}

export async function createVaultFile(encryptedContent: string): Promise<string> {
  const metadata = {
    name: VAULT_FILENAME,
    parents: ["appDataFolder"],
    mimeType: "application/json",
  };

  const boundary = "vault_boundary_" + Date.now();
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: application/json",
    "",
    encryptedContent,
    `--${boundary}--`,
  ].join("\r\n");

  const response = await fetch(
    `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`,
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!response.ok) await handleApiError(response);

  const data = (await response.json()) as DriveFileResponse;
  return data.id;
}

export async function readVaultFile(fileId: string): Promise<string> {
  const params = new URLSearchParams({ alt: "media" });
  const response = await fetch(
    `${DRIVE_API_BASE}/files/${fileId}?${params}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) await handleApiError(response);
  return response.text();
}

export async function updateVaultFile(
  fileId: string,
  encryptedContent: string
): Promise<void> {
  const response = await fetch(
    `${DRIVE_UPLOAD_BASE}/files/${fileId}?uploadType=media`,
    {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: encryptedContent,
    }
  );
  if (!response.ok) await handleApiError(response);
}

export async function deleteVaultFile(fileId: string): Promise<void> {
  const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleApiError(response);
}

const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export async function getUserEmail(): Promise<string | null> {
  try {
    const response = await fetch(USERINFO_URL, { headers: getAuthHeaders() });
    if (!response.ok) return null;
    const data = (await response.json()) as { email?: string };
    return data.email ?? null;
  } catch {
    return null;
  }
}
