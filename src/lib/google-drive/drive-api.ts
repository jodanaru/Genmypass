/**
 * Google Drive API - CRUD para vault.json en appDataFolder.
 * Usa el scope drive.appdata (carpeta oculta específica de la app).
 */

import { getAccessToken } from "./token-manager.js";

const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";
const VAULT_FILENAME = "vault.json";

/** Metadata de un archivo en Drive */
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

/** Respuesta de búsqueda de archivos */
interface FileListResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

/** Error de la API de Drive */
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

/**
 * Obtiene headers con el token de autorización.
 * Lanza error si no hay token disponible.
 */
function getAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  if (!token) {
    throw new DriveApiError("No hay token de acceso disponible", 401, "no_token");
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Maneja errores de la API de Drive.
 */
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
    // Si no se puede parsear el error, usar el mensaje por defecto
  }

  throw new DriveApiError(errorMessage, response.status, errorCode);
}

/**
 * Busca el archivo vault.json en appDataFolder.
 * Retorna el archivo si existe, null si no existe.
 */
export async function findVaultFile(): Promise<DriveFile | null> {
  const params = new URLSearchParams({
    spaces: "appDataFolder",
    q: `name = '${VAULT_FILENAME}' and trashed = false`,
    fields: "files(id, name, mimeType, modifiedTime)",
  });

  const response = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  const data: FileListResponse = await response.json();
  return data.files.length > 0 ? data.files[0] ?? null : null;
}

/**
 * Crea el archivo vault.json en appDataFolder con el contenido cifrado.
 * Retorna el ID del archivo creado.
 */
export async function createVaultFile(
  encryptedContent: string
): Promise<string> {
  // Metadata del archivo
  const metadata = {
    name: VAULT_FILENAME,
    parents: ["appDataFolder"],
    mimeType: "application/json",
  };

  // Crear multipart request
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

  if (!response.ok) {
    await handleApiError(response);
  }

  const data = (await response.json()) as DriveFile;
  return data.id;
}

/**
 * Lee el contenido del archivo vault.json.
 * Retorna el contenido cifrado como string.
 */
export async function readVaultFile(fileId: string): Promise<string> {
  const params = new URLSearchParams({
    alt: "media",
  });

  const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?${params}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.text();
}

/**
 * Actualiza el contenido del archivo vault.json.
 */
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

  if (!response.ok) {
    await handleApiError(response);
  }
}

/**
 * Elimina el archivo vault.json (mueve a papelera).
 * Útil para reset o testing.
 */
export async function deleteVaultFile(fileId: string): Promise<void> {
  const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    await handleApiError(response);
  }
}

/**
 * Función de alto nivel: obtiene o crea el vault.
 * - Si existe, retorna { fileId, content }
 * - Si no existe, retorna { fileId: null, content: null }
 */
export async function getOrCreateVault(): Promise<{
  fileId: string | null;
  content: string | null;
  isNew: boolean;
}> {
  const existingFile = await findVaultFile();

  if (existingFile) {
    const content = await readVaultFile(existingFile.id);
    return {
      fileId: existingFile.id,
      content,
      isNew: false,
    };
  }

  return {
    fileId: null,
    content: null,
    isNew: true,
  };
}

/**
 * Guarda el vault (crea si no existe, actualiza si existe).
 */
export async function saveVault(
  encryptedContent: string,
  existingFileId?: string | null
): Promise<string> {
  if (existingFileId) {
    await updateVaultFile(existingFileId, encryptedContent);
    return existingFileId;
  }

  return createVaultFile(encryptedContent);
}
