/**
 * Export del vault: backup cifrado (.genmypass) y CSV para migración.
 * Zero-knowledge: el cifrado se hace en cliente con sal nueva para el backup.
 */

import {
  initSodium,
  deriveKeyWithNewSalt,
  encrypt,
  toBase64,
  DEFAULT_argon2_PARAMS,
} from "@/lib/crypto";
import type { Vault, Folder } from "@/stores/vault-store";

export interface ExportOptions {
  format: "encrypted" | "csv";
  includeSettings?: boolean;
}

const BACKUP_FORMAT_VERSION = 1;
const KDF_PARALLELISM = 4;

function escapeCsvField(value: string): string {
  const s = String(value ?? "");
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Exporta el vault como archivo cifrado .genmypass.
 * Usa una sal nueva (no la del vault). Solo puede abrirse con la master password.
 */
export async function exportVaultEncrypted(
  vault: Vault,
  masterPassword: string
): Promise<Blob> {
  await initSodium();
  const { key, salt } = deriveKeyWithNewSalt(
    masterPassword,
    DEFAULT_argon2_PARAMS
  );

  const payload = {
    version: vault.version,
    entries: vault.entries,
    folders: vault.folders,
    ...(vault.settings != null && { settings: vault.settings }),
    createdAt: vault.createdAt,
    updatedAt: vault.updatedAt,
  };
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const { iv, tag, data } = await encrypt({ key, plaintext });

  const created_at = new Date().toISOString();
  const backup = {
    format: "genmypass-backup",
    version: BACKUP_FORMAT_VERSION,
    created_at,
    encryption: {
      algorithm: "AES-256-GCM",
      kdf: "argon2id",
      kdf_params: {
        memory: DEFAULT_argon2_PARAMS.memLimit,
        iterations: DEFAULT_argon2_PARAMS.opsLimit,
        parallelism: KDF_PARALLELISM,
      },
      salt: toBase64(salt),
      iv: toBase64(iv),
      tag: toBase64(tag),
    },
    data: toBase64(data),
  };

  return new Blob([JSON.stringify(backup, null, 0)], {
    type: "application/json",
  });
}

/**
 * Exporta solo las entries como CSV (texto plano). Solo para migración.
 * No incluye settings, master password ni salt.
 */
export function exportVaultCSV(vault: Vault): Blob {
  const header = "name,url,username,password,notes,folder,favorite";
  const folderById = new Map<string, Folder>(
    vault.folders.map((f) => [f.id, f])
  );

  const rows: string[] = [header];
  for (const e of vault.entries) {
    const folderName = e.folderId
      ? folderById.get(e.folderId)?.name ?? ""
      : "";
    rows.push(
      [
        escapeCsvField(e.title),
        escapeCsvField(e.url ?? ""),
        escapeCsvField(e.username),
        escapeCsvField(e.password),
        escapeCsvField(e.notes ?? ""),
        escapeCsvField(folderName),
        e.favorite ? "1" : "0",
      ].join(",")
    );
  }

  return new Blob([rows.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
}
