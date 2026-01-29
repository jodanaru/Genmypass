import { describe, it, expect } from "vitest";
import {
  randomBytes,
  toBase64,
  fromBase64,
  concat,
  stringToBytes,
  bytesToString,
  IV_LENGTH,
  GCM_TAG_LENGTH,
  KEY_LENGTH,
  SALT_LENGTH,
} from "../utils.js";

describe("crypto utils", () => {
  it("randomBytes returns correct length", () => {
    expect(randomBytes(16).length).toBe(16);
    expect(randomBytes(32).length).toBe(32);
  });

  it("randomBytes returns different values each call", () => {
    const a = randomBytes(16);
    const b = randomBytes(16);
    expect(a).not.toEqual(b);
  });

  it("toBase64 and fromBase64 roundtrip", () => {
    const bytes = new Uint8Array([1, 2, 255, 0, 128]);
    expect(fromBase64(toBase64(bytes))).toEqual(bytes);
  });

  it("concat combines arrays", () => {
    const a = new Uint8Array([1, 2]);
    const b = new Uint8Array([3, 4, 5]);
    expect(concat(a, b)).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
  });

  it("stringToBytes and bytesToString roundtrip", () => {
    const s = "Hello, 世界";
    expect(bytesToString(stringToBytes(s))).toBe(s);
  });

  it("exports correct constants", () => {
    expect(IV_LENGTH).toBe(12);
    expect(GCM_TAG_LENGTH).toBe(16);
    expect(KEY_LENGTH).toBe(32);
    expect(SALT_LENGTH).toBe(16);
  });
});
