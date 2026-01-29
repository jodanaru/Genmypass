import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "../encryption.js";
import { deriveKeyWithNewSalt } from "../kdf.js";
import { initSodium } from "../kdf.js";
import { stringToBytes, bytesToString } from "../utils.js";

describe("encryption", () => {
  let key: Uint8Array;

  beforeAll(async () => {
    await initSodium();
    const kdf = deriveKeyWithNewSalt("test-master-password");
    key = kdf.key;
  });

  it("encrypt and decrypt roundtrip", async () => {
    const plaintext = stringToBytes("secret message");
    const ct = await encrypt({ key, plaintext });
    expect(ct.iv.length).toBe(12);
    expect(ct.tag.length).toBe(16);
    expect(ct.data).not.toEqual(plaintext);

    const dec = await decrypt({ key, ciphertext: ct });
    expect(dec.length).toBe(plaintext.length);
    expect(Array.from(dec)).toEqual(Array.from(plaintext));
    expect(bytesToString(dec)).toBe("secret message");
  });

  it("different IV each encryption", async () => {
    const plaintext = new Uint8Array([1, 2, 3]);
    const ct1 = await encrypt({ key, plaintext });
    const ct2 = await encrypt({ key, plaintext });
    expect(ct1.iv).not.toEqual(ct2.iv);
    expect(ct1.data).not.toEqual(ct2.data);
  });

  it("decrypt with wrong key fails", async () => {
    const plaintext = new Uint8Array([1, 2, 3]);
    const ct = await encrypt({ key, plaintext });
    const wrongKey = new Uint8Array(32);
    wrongKey.fill(0);
    await expect(
      decrypt({ key: wrongKey, ciphertext: ct })
    ).rejects.toThrow();
  });
});
