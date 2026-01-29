import { describe, it, expect, beforeAll } from "vitest";
import { initSodium, deriveKey, deriveKeyWithNewSalt } from "../kdf.js";

beforeAll(async () => {
  await initSodium();
});

describe("kdf", () => {
  it("deriveKey returns 32-byte key and same salt", () => {
    const salt = new Uint8Array(16);
    salt.fill(1);
    const result = deriveKey("password123", salt);
    expect(result.key.length).toBe(32);
    expect(result.salt).toBe(salt);
  });

  it("same password and salt yield same key", () => {
    const salt = new Uint8Array(16);
    salt.fill(2);
    const a = deriveKey("secret", salt);
    const b = deriveKey("secret", salt);
    expect(a.key).toEqual(b.key);
  });

  it("different password yields different key", () => {
    const salt = new Uint8Array(16);
    salt.fill(3);
    const a = deriveKey("pass1", salt);
    const b = deriveKey("pass2", salt);
    expect(a.key).not.toEqual(b.key);
  });

  it("deriveKeyWithNewSalt returns new salt each time", () => {
    const r1 = deriveKeyWithNewSalt("pass");
    const r2 = deriveKeyWithNewSalt("pass");
    expect(r1.salt).not.toEqual(r2.salt);
    expect(r1.key).not.toEqual(r2.key);
  });
});
