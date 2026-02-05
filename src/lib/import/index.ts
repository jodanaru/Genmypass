/**
 * Import al vault desde .genmypass, CSV (Genmypass), Bitwarden JSON, LastPass CSV, 1Password CSV.
 * Validación de tamaño, estructura y sanitización de campos.
 */

import {
  initSodium,
  deriveKey,
  decrypt,
  fromBase64,
  bytesToString,
  type Argon2Params,
  DEFAULT_argon2_PARAMS,
} from "@/lib/crypto";
import type { VaultEntry, Folder } from "@/stores/vault-store";

export const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export interface ImportResult {
  success: boolean;
  entries: VaultEntry[];
  folders: Folder[];
  settings?: import("@/stores/settings-store").UserSettings;
  errors: string[];
  warnings: string[];
}

export interface ImportOptions {
  merge?: boolean;
}

const MAX_FIELD_LENGTH = 2048;
const CONTROL_CHARS = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

function sanitize(str: string): string {
  if (typeof str !== "string") return "";
  const trimmed = str.replace(CONTROL_CHARS, "").trim();
  return trimmed.length > MAX_FIELD_LENGTH
    ? trimmed.slice(0, MAX_FIELD_LENGTH)
    : trimmed;
}

function ensureId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function normalizeEntry(raw: Record<string, unknown>): VaultEntry {
  const id =
    typeof raw.id === "string" && raw.id.length > 0 ? raw.id : ensureId();
  return {
    id,
    title: sanitize(String(raw.title ?? raw.name ?? "")),
    username: sanitize(String(raw.username ?? "")),
    password: sanitize(String(raw.password ?? "")),
    url: sanitize(String(raw.url ?? "")) || undefined,
    notes: sanitize(String(raw.notes ?? "")) || undefined,
    folderId:
      typeof raw.folderId === "string" && raw.folderId.length > 0
        ? raw.folderId
        : undefined,
    favorite: Boolean(raw.favorite),
    createdAt:
      typeof raw.createdAt === "string" ? raw.createdAt : now(),
    updatedAt:
      typeof raw.updatedAt === "string" ? raw.updatedAt : now(),
  };
}

function normalizeFolder(raw: Record<string, unknown>): Folder {
  const id =
    typeof raw.id === "string" && raw.id.length > 0 ? raw.id : ensureId();
  return {
    id,
    name: sanitize(String(raw.name ?? "")),
    color:
      typeof raw.color === "string" && raw.color.length > 0
        ? raw.color
        : undefined,
  };
}

function kdfParamsFromBackup(
  kdf_params: Record<string, unknown> | undefined
): Argon2Params {
  if (!kdf_params || typeof kdf_params !== "object") {
    return DEFAULT_argon2_PARAMS;
  }
  const memory =
    typeof kdf_params.memory === "number" && kdf_params.memory > 0
      ? kdf_params.memory
      : DEFAULT_argon2_PARAMS.memLimit;
  const opsLimit =
    typeof kdf_params.iterations === "number" && kdf_params.iterations > 0
      ? kdf_params.iterations
      : DEFAULT_argon2_PARAMS.opsLimit;
  return {
    memLimit: memory,
    opsLimit,
    outputLen: 32,
  };
}

/**
 * Parsea una línea CSV respetando comillas (campos entre comillas pueden contener comas).
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (inQuotes) {
      current += c;
    } else if (c === ",") {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

/**
 * Importa desde archivo .genmypass (backup cifrado).
 */
export async function importFromGenmypass(
  file: File,
  masterPassword: string
): Promise<ImportResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (file.size > MAX_IMPORT_FILE_SIZE) {
    return {
      success: false,
      entries: [],
      folders: [],
      errors: ["File exceeds 10 MB limit"],
      warnings: [],
    };
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    errors.push("Could not read file");
    return { success: false, entries: [], folders: [], errors, warnings };
  }

  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    errors.push("Invalid JSON");
    return { success: false, entries: [], folders: [], errors, warnings };
  }

  if (json.format !== "genmypass-backup") {
    errors.push("Not a Genmypass backup file (missing or wrong format)");
    return { success: false, entries: [], folders: [], errors, warnings };
  }

  const enc = json.encryption as Record<string, unknown> | undefined;
  if (!enc || typeof enc !== "object") {
    errors.push("Missing encryption metadata");
    return { success: false, entries: [], folders: [], errors, warnings };
  }

  const saltB64 = enc.salt;
  const ivB64 = enc.iv;
  const tagB64 = enc.tag;
  const dataB64 = json.data;

  if (
    typeof saltB64 !== "string" ||
    typeof ivB64 !== "string" ||
    typeof tagB64 !== "string" ||
    typeof dataB64 !== "string"
  ) {
    errors.push("Missing or invalid encryption fields (salt, iv, tag, data)");
    return { success: false, entries: [], folders: [], errors, warnings };
  }

  await initSodium();
  const params = kdfParamsFromBackup(enc.kdf_params as Record<string, unknown> | undefined);
  let key: Uint8Array;
  try {
    key = deriveKey(masterPassword, fromBase64(saltB64), params).key;
  } catch {
    errors.push("Invalid salt encoding");
    return { success: false, entries: [], folders: [], errors, warnings };
  }

  let plaintext: Uint8Array;
  try {
    plaintext = await decrypt({
      key,
      ciphertext: {
        iv: fromBase64(ivB64),
        tag: fromBase64(tagB64),
        data: fromBase64(dataB64),
      },
    });
  } catch {
    errors.push("Decryption failed (wrong password or corrupted file)");
    return { success: false, entries: [], folders: [], errors, warnings };
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(bytesToString(plaintext)) as Record<string, unknown>;
  } catch {
    errors.push("Decrypted content is not valid JSON");
    return { success: false, entries: [], folders: [], errors, warnings };
  }

  const rawEntries = Array.isArray(payload.entries) ? payload.entries : [];
  const rawFolders = Array.isArray(payload.folders) ? payload.folders : [];
  const folderIdMap = new Map<string, string>(); // old id -> new id
  const folders: Folder[] = rawFolders.map((f: unknown) => {
    const folder = normalizeFolder(f as Record<string, unknown>);
    folderIdMap.set((f as Record<string, unknown>).id as string, folder.id);
    return folder;
  });
  const entries: VaultEntry[] = rawEntries.map((e: unknown) => {
    const entry = normalizeEntry(e as Record<string, unknown>);
    if (entry.folderId && folderIdMap.has(entry.folderId)) {
      entry.folderId = folderIdMap.get(entry.folderId)!;
    }
    if (!entry.id || entry.id === (e as Record<string, unknown>).id) {
      entry.id = ensureId();
    }
    return entry;
  });

  const settings =
    payload.settings &&
    typeof payload.settings === "object" &&
    !Array.isArray(payload.settings)
      ? (payload.settings as ImportResult["settings"])
      : undefined;

  return {
    success: true,
    entries,
    folders,
    settings,
    errors: [],
    warnings,
  };
}

/**
 * Importa desde CSV Genmypass (name,url,username,password,notes,folder).
 */
export async function importFromCSV(file: File): Promise<ImportResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (file.size > MAX_IMPORT_FILE_SIZE) {
    return {
      success: false,
      entries: [],
      folders: [],
      errors: ["File exceeds 10 MB limit"],
      warnings: [],
    };
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    errors.push("Could not read file");
    return { success: false, entries: [], folders: [], errors, warnings };
  }

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 1) {
    errors.push("File is empty");
    return { success: false, entries: [], folders: [], errors, warnings };
  }

  const header = parseCsvLine(lines[0]!);
  const headerLower = header.map((h) => h.toLowerCase().trim());
  const nameIdx = headerLower.findIndex(
    (h) => h === "name" || h === "title"
  );
  const urlIdx = headerLower.findIndex((h) => h === "url");
  const userIdx = headerLower.findIndex(
    (h) => h === "username" || h === "user"
  );
  const passIdx = headerLower.findIndex((h) => h === "password");
  const notesIdx = headerLower.findIndex((h) => h === "notes");
  const folderIdx = headerLower.findIndex((h) => h === "folder");
  const favoriteIdx = headerLower.findIndex((h) => h === "favorite");

  if (nameIdx < 0 || passIdx < 0) {
    errors.push("CSV must have at least 'name' and 'password' columns");
    return { success: false, entries: [], folders: [], errors, warnings };
  }

  const folderNames = new Set<string>();
  const folderByName = new Map<string, Folder>();
  const entries: VaultEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]!);
    const title = sanitize(cells[nameIdx] ?? "");
    const url = sanitize(cells[urlIdx] ?? "");
    const username = sanitize(cells[userIdx] ?? "");
    const password = sanitize(cells[passIdx] ?? "");
    const notes = sanitize(cells[notesIdx] ?? "");
    const folderName = sanitize(cells[folderIdx] ?? "");
    const favoriteCell =
      favoriteIdx >= 0 ? String(cells[favoriteIdx] ?? "").trim().toLowerCase() : "";
    const favorite =
      favoriteIdx >= 0 &&
      (favoriteCell === "1" ||
        favoriteCell === "true" ||
        favoriteCell === "yes");

    if (!title && !username && !password) continue;

    let folderId: string | undefined;
    if (folderName) {
      folderNames.add(folderName);
      if (!folderByName.has(folderName)) {
        const folder: Folder = {
          id: ensureId(),
          name: folderName,
        };
        folderByName.set(folderName, folder);
      }
      folderId = folderByName.get(folderName)!.id;
    }

    entries.push({
      id: ensureId(),
      title: title || "Untitled",
      username,
      password,
      url: url || undefined,
      notes: notes || undefined,
      folderId,
      favorite,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  const folders = Array.from(folderByName.values());
  return {
    success: true,
    entries,
    folders,
    errors: [],
    warnings,
  };
}

/**
 * Importa desde export JSON de Bitwarden (items[], type 1 = login).
 */
export async function importFromBitwarden(file: File): Promise<ImportResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (file.size > MAX_IMPORT_FILE_SIZE) {
    return {
      success: false,
      entries: [],
      folders: [],
      errors: ["File exceeds 10 MB limit"],
      warnings: [],
    };
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    errors.push("Could not read file");
    return { success: false, entries: [], folders: [], errors, warnings };
  }

  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    errors.push("Invalid JSON");
    return { success: false, entries: [], folders: [], errors, warnings };
  }

  const items = Array.isArray(json.items) ? json.items : [];
  const entries: VaultEntry[] = [];
  for (const item of items) {
    const o = item as Record<string, unknown>;
    if (o.type !== 1) continue; // 1 = login
    const login = o.login as Record<string, unknown> | undefined;
    if (!login || typeof login !== "object") continue;
    const uris = login.uris as Array<{ uri?: string }> | undefined;
    const uri = Array.isArray(uris) && uris[0]?.uri ? String(uris[0].uri) : "";
    entries.push({
      id: ensureId(),
      title: sanitize(String(o.name ?? "")),
      username: sanitize(String(login.username ?? "")),
      password: sanitize(String(login.password ?? "")),
      url: sanitize(uri) || undefined,
      notes: sanitize(String(o.notes ?? "")) || undefined,
      folderId: undefined,
      favorite: false,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  return {
    success: true,
    entries,
    folders: [],
    errors: [],
    warnings,
  };
}

/**
 * Importa desde CSV de LastPass (url,username,password,extra,name,grouping,fav).
 */
export async function importFromLastPass(file: File): Promise<ImportResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (file.size > MAX_IMPORT_FILE_SIZE) {
    return {
      success: false,
      entries: [],
      folders: [],
      errors: ["File exceeds 10 MB limit"],
      warnings: [],
    };
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    errors.push("Could not read file");
    return { success: false, entries: [], folders: [], errors, warnings };
  }

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 1) {
    errors.push("File is empty");
    return { success: false, entries: [], folders: [], errors, warnings };
  }

  const header = parseCsvLine(lines[0]!);
  const headerLower = header.map((h) => h.toLowerCase().trim());
  const urlIdx = headerLower.indexOf("url");
  const userIdx = headerLower.indexOf("username");
  const passIdx = headerLower.indexOf("password");
  const extraIdx = headerLower.indexOf("extra");
  const nameIdx = headerLower.indexOf("name");
  const groupIdx = headerLower.indexOf("grouping");
  const favIdx = headerLower.indexOf("fav");

  if (passIdx < 0) {
    errors.push("CSV must have 'password' column");
    return { success: false, entries: [], folders: [], errors, warnings };
  }

  const folderByName = new Map<string, Folder>();
  const entries: VaultEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]!);
    const url = sanitize(cells[urlIdx] ?? "");
    const username = sanitize(cells[userIdx] ?? "");
    const password = sanitize(cells[passIdx] ?? "");
    const extra = sanitize(cells[extraIdx] ?? "");
    const name = sanitize(cells[nameIdx] ?? "");
    const grouping = sanitize(cells[groupIdx] ?? "");
    const fav = cells[favIdx] ?? "0";

    if (!password && !username && !url) continue;

    let folderId: string | undefined;
    if (grouping) {
      if (!folderByName.has(grouping)) {
        folderByName.set(grouping, {
          id: ensureId(),
          name: grouping,
        });
      }
      folderId = folderByName.get(grouping)!.id;
    }

    const title = name || url || "Untitled";
    entries.push({
      id: ensureId(),
      title,
      username,
      password,
      url: url || undefined,
      notes: extra || undefined,
      folderId,
      favorite: fav === "1",
      createdAt: now(),
      updatedAt: now(),
    });
  }

  const folders = Array.from(folderByName.values());
  return {
    success: true,
    entries,
    folders,
    errors: [],
    warnings,
  };
}

/**
 * Importa desde CSV de 1Password (Title,Url,Username,Password,Notes,Type).
 */
/**
 * Detecta el formato de un archivo de importación sin descifrar (.genmypass requiere password después).
 */
export async function detectImportFormat(
  file: File
): Promise<
  "genmypass" | "bitwarden" | "csv-lastpass" | "csv-1password" | "csv"
> {
  if (file.size > MAX_IMPORT_FILE_SIZE) {
    throw new Error("File exceeds 10 MB limit");
  }
  const text = await file.text();
  const name = file.name.toLowerCase();

  if (name.endsWith(".genmypass")) return "genmypass";
  if (name.endsWith(".json")) {
    try {
      const j = JSON.parse(text) as Record<string, unknown>;
      if (j.format === "genmypass-backup") return "genmypass";
      if (
        Array.isArray(j.items) ||
        (j.items && typeof j.items === "object")
      )
        return "bitwarden";
    } catch {
      /* not valid JSON */
    }
  }
  const firstLine = text.split(/\r?\n/)[0]?.toLowerCase() ?? "";
  if (
    name.endsWith(".csv") ||
    (text.trim().length > 0 &&
      !text.trim().startsWith("{") &&
      firstLine.includes(","))
  ) {
    if (
      firstLine.includes("url") &&
      firstLine.includes("username") &&
      firstLine.includes("grouping")
    )
      return "csv-lastpass";
    if (
      firstLine.includes("title") &&
      firstLine.includes("url") &&
      firstLine.includes("username")
    )
      return "csv-1password";
    return "csv";
  }
  return "csv";
}

export async function importFrom1Password(file: File): Promise<ImportResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (file.size > MAX_IMPORT_FILE_SIZE) {
    return {
      success: false,
      entries: [],
      folders: [],
      errors: ["File exceeds 10 MB limit"],
      warnings: [],
    };
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    errors.push("Could not read file");
    return { success: false, entries: [], folders: [], errors, warnings };
  }

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 1) {
    errors.push("File is empty");
    return { success: false, entries: [], folders: [], errors, warnings };
  }

  const header = parseCsvLine(lines[0]!);
  const headerLower = header.map((h) => h.toLowerCase().trim());
  const titleIdx = headerLower.indexOf("title");
  const urlIdx = headerLower.indexOf("url");
  const userIdx = headerLower.indexOf("username");
  const passIdx = headerLower.indexOf("password");
  const notesIdx = headerLower.indexOf("notes");
  const typeIdx = headerLower.indexOf("type");

  if (passIdx < 0) {
    errors.push("CSV must have 'Password' column");
    return { success: false, entries: [], folders: [], errors, warnings };
  }

  const entries: VaultEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]!);
    const type = sanitize(cells[typeIdx] ?? "").toLowerCase();
    if (type && type !== "login") continue;

    const title = sanitize(cells[titleIdx] ?? "") || "Untitled";
    const url = sanitize(cells[urlIdx] ?? "");
    const username = sanitize(cells[userIdx] ?? "");
    const password = sanitize(cells[passIdx] ?? "");
    const notes = sanitize(cells[notesIdx] ?? "");

    if (!password && !username && !url) continue;

    entries.push({
      id: ensureId(),
      title,
      username,
      password,
      url: url || undefined,
      notes: notes || undefined,
      folderId: undefined,
      favorite: false,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  return {
    success: true,
    entries,
    folders: [],
    errors: [],
    warnings,
  };
}
