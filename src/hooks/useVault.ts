import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import {
  getSettingsForVault,
  useSettingsStore,
} from "@/stores/settings-store";
import { useVaultStore, type Vault } from "@/stores/vault-store";
import { readVaultFile, saveVault } from "@/lib/google-drive";
import { decrypt, encrypt, fromBase64, toBase64 } from "@/lib/crypto";

interface EncryptedVault {
  salt?: string;
  iv: string;
  tag: string;
  data: string;
}

export function useVault() {
  const navigate = useNavigate();
  const masterKey = useAuthStore((s) => s.masterKey);
  const isUnlocked = useAuthStore((s) => s.isUnlocked);

  const vault = useVaultStore((s) => s.vault);
  const isLoading = useVaultStore((s) => s.isLoading);
  const error = useVaultStore((s) => s.error);
  const setVault = useVaultStore((s) => s.setVault);
  const setLoading = useVaultStore((s) => s.setLoading);
  const setError = useVaultStore((s) => s.setError);

  useEffect(() => {
    const loadVault = async () => {
      const justCompletedSetup =
        sessionStorage.getItem("genmypass_just_setup") === "true";

      if (!isUnlocked || !masterKey) {
        if (!justCompletedSetup) {
          navigate("/lock", { replace: true });
        }
        return;
      }

      sessionStorage.removeItem("genmypass_just_setup");

      if (vault) return;

      const storedFileId = localStorage.getItem("genmypass_vault_file_id");
      if (!storedFileId) {
        setError(
          "No se encontró el vault. Por favor, configura tu cuenta de nuevo."
        );
        return;
      }

      setLoading(true);

      try {
        const encryptedContent = await readVaultFile(storedFileId);
        const encrypted: EncryptedVault = JSON.parse(encryptedContent);

        const decrypted = await decrypt({
          key: masterKey,
          ciphertext: {
            iv: fromBase64(encrypted.iv),
            tag: fromBase64(encrypted.tag),
            data: fromBase64(encrypted.data),
          },
        });

        const vaultData: Vault = JSON.parse(
          new TextDecoder().decode(decrypted)
        );
        setVault(vaultData, storedFileId, encrypted.salt ?? null);
        if (vaultData.settings) {
          useSettingsStore.getState().setSettingsFromVault(vaultData.settings);
        }
      } catch (err) {
        console.error("Error loading vault:", err);
        setError("Error al cargar el vault. Verifica tu conexión.");
      } finally {
        setLoading(false);
      }
    };

    loadVault();
  }, [
    isUnlocked,
    masterKey,
    vault,
    navigate,
    setVault,
    setLoading,
    setError,
  ]);

  const save = useCallback(async () => {
    const state = useVaultStore.getState();
    const currentVault = state.vault;
    const currentFileId = state.fileId;
    const currentSalt = state.vaultFileSalt;
    if (!currentVault || !masterKey || !currentFileId) return;

    try {
      const payload = { ...currentVault, settings: getSettingsForVault() };
      const vaultJson = JSON.stringify(payload);
      const vaultBytes = new TextEncoder().encode(vaultJson);
      const { iv, tag, data } = await encrypt({
        key: masterKey,
        plaintext: vaultBytes,
      });

      const encryptedVault = JSON.stringify({
        ...(currentSalt ? { salt: currentSalt } : {}),
        iv: toBase64(iv),
        tag: toBase64(tag),
        data: toBase64(data),
      });

      await saveVault(encryptedVault, currentFileId);
    } catch (err) {
      console.error("Error saving vault:", err);
      throw err;
    }
  }, [masterKey]);

  return {
    vault,
    isLoading,
    error,
    save,
    entries: vault?.entries ?? [],
    folders: vault?.folders ?? [],
  };
}
