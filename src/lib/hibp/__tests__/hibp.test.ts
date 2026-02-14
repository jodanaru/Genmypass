import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// SHA-1("password") = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8 (prefix 5BAA6, suffix 1E4C9B93F3F0682250B6CF8331B7EE68FD8)
const PASSWORD_SHA1_HEX = "5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8";

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes.buffer;
}

describe("hibp", () => {
  const originalFetch = global.fetch;
  const originalDigest = crypto.subtle?.digest;

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("fetch not mocked")))
    );
    // Mock crypto.subtle.digest so SHA-1 is deterministic in tests
    if (crypto.subtle) {
      vi.spyOn(crypto.subtle, "digest").mockImplementation(
        async (_alg: string, data: BufferSource) => {
          const text = new TextDecoder().decode(data);
          if (text === "password") {
            return hexToArrayBuffer(PASSWORD_SHA1_HEX);
          }
          // For any other input, return a hash that won't match our mocked API response
          const fakeHash = "0000000000000000000000000000000000000000";
          return hexToArrayBuffer(fakeHash);
        }
      );
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", originalFetch);
    if (originalDigest && crypto.subtle) {
      (crypto.subtle.digest as typeof originalDigest) = originalDigest;
    }
  });

  describe("checkPasswordBreach", () => {
    it("returns { breached: false, count: 0 } for empty password without calling fetch", async () => {
      const { checkPasswordBreach } = await import("../index.js");
      const result = await checkPasswordBreach("");
      expect(result).toEqual({ breached: false, count: 0 });
      expect(fetch).not.toHaveBeenCalled();
    });

    it("returns { breached: true, count } for known compromised password (e.g. 'password')", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        text: async () =>
          "1E4C9B93F3F0682250B6CF8331B7EE68FD8:372643\n",
      } as Response);

      const { checkPasswordBreach } = await import("../index.js");
      const result = await checkPasswordBreach("password");

      expect(result).toEqual({ breached: true, count: 372643 });
      expect(fetch).toHaveBeenCalledWith(
        "https://api.pwnedpasswords.com/range/5BAA6",
        expect.any(Object)
      );
    });

    it("returns { breached: false, count: 0 } when password is not in response", async () => {
      // Mock returns a different suffix so the hash (fake 00...0) does not match
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        text: async () =>
          "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF:1\n",
      } as Response);

      const { checkPasswordBreach } = await import("../index.js");
      const result = await checkPasswordBreach("uniqueSafePassword123!XyZ");

      expect(result).toEqual({ breached: false, count: 0 });
    });

    it("uses cache: second call with same password does not call fetch again", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        text: async () => "99999999999999999999999999999999999:0\n",
      } as Response);

      const { checkPasswordBreach } = await import("../index.js");
      const result1 = await checkPasswordBreach("cacheTestPassword");
      const result2 = await checkPasswordBreach("cacheTestPassword");

      expect(result1).toEqual({ breached: false, count: 0 });
      expect(result2).toEqual({ breached: false, count: 0 });
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("returns { breached: false, count: 0, error: true } on network error without throwing", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

      const { checkPasswordBreach } = await import("../index.js");
      const result = await checkPasswordBreach("any");

      expect(result).toEqual({ breached: false, count: 0, error: true });
    });

    it("returns { breached: false, count: 0, error: true, status } when API returns non-OK", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as Response);

      const { checkPasswordBreach } = await import("../index.js");
      const result = await checkPasswordBreach("any");

      expect(result).toEqual({
        breached: false,
        count: 0,
        error: true,
        status: 503,
      });
    });
  });
});
