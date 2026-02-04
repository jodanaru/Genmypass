import { describe, it, expect, vi, beforeEach } from "vitest";
import * as tokenManager from "../token-manager.js";

// Mock del token manager
vi.mock("../token-manager.js", () => ({
  getAccessToken: vi.fn(),
}));

describe("drive-api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("findVaultFile", () => {
    it("debería retornar null si no existe el vault", async () => {
      vi.mocked(tokenManager.getAccessToken).mockReturnValue("fake-token");
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: [] }),
      } as Response);

      const { findVaultFile } = await import("../drive-api.js");
      const result = await findVaultFile();

      expect(result).toBeNull();
    });

    it("debería retornar el archivo si existe", async () => {
      vi.mocked(tokenManager.getAccessToken).mockReturnValue("fake-token");
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          files: [
            {
              id: "file123",
              name: "vault.json",
              mimeType: "application/json",
            },
          ],
        }),
      } as Response);

      const { findVaultFile } = await import("../drive-api.js");
      const result = await findVaultFile();

      expect(result).toEqual({
        id: "file123",
        name: "vault.json",
        mimeType: "application/json",
      });
    });

    it("debería lanzar error si no hay token", async () => {
      vi.mocked(tokenManager.getAccessToken).mockReturnValue(null);

      const { findVaultFile } = await import("../drive-api.js");

      await expect(findVaultFile()).rejects.toThrow(
        "No hay token de acceso disponible"
      );
    });
  });

  describe("createVaultFile", () => {
    it("debería crear el archivo y retornar el ID", async () => {
      vi.mocked(tokenManager.getAccessToken).mockReturnValue("fake-token");
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "new-file-123" }),
      } as Response);

      const { createVaultFile } = await import("../drive-api.js");
      const fileId = await createVaultFile('{"encrypted": "data"}');

      expect(fileId).toBe("new-file-123");
    });
  });
});
