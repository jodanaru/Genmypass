/**
 * Helpers de alto nivel para vault que usan el proveedor actual.
 */
import { getCurrentProvider } from "./provider-factory.js";

export async function getOrCreateVault(): Promise<{
  fileId: string | null;
  content: string | null;
  isNew: boolean;
}> {
  const provider = getCurrentProvider();
  if (!provider) throw new Error("No cloud provider configured");

  const existingFile = await provider.findVaultFile();
  if (existingFile) {
    const content = await provider.readVaultFile(existingFile.id);
    return { fileId: existingFile.id, content, isNew: false };
  }
  return { fileId: null, content: null, isNew: true };
}

export async function saveVault(
  encryptedContent: string,
  existingFileId?: string | null
): Promise<string> {
  const provider = getCurrentProvider();
  if (!provider) throw new Error("No cloud provider configured");

  if (existingFileId) {
    await provider.updateVaultFile(existingFileId, encryptedContent);
    return existingFileId;
  }
  return provider.createVaultFile(encryptedContent);
}
