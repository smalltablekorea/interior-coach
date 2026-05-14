import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "@/lib/crypto";

describe("Crypto — AES-256-GCM encryption", () => {
  it("encrypts and decrypts back to original", () => {
    const original = "인테리어 견적서 비밀 데이터";
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it("encrypted output differs from plaintext", () => {
    const encrypted = encrypt("hello");
    expect(encrypted).not.toBe("hello");
  });

  it("same plaintext produces different ciphertexts (random IV)", () => {
    const a = encrypt("test");
    const b = encrypt("test");
    expect(a).not.toBe(b);
  });

  it("handles empty string", () => {
    const encrypted = encrypt("");
    expect(decrypt(encrypted)).toBe("");
  });

  it("handles long strings", () => {
    const long = "가".repeat(10000);
    const encrypted = encrypt(long);
    expect(decrypt(encrypted)).toBe(long);
  });

  it("handles special characters", () => {
    const special = '{"key": "value", "한글": "데이터", "emoji": "🏠"}';
    expect(decrypt(encrypt(special))).toBe(special);
  });

  it("tampered ciphertext throws", () => {
    const encrypted = encrypt("test");
    const buf = Buffer.from(encrypted, "base64");
    buf[buf.length - 1] ^= 0xff; // flip last byte
    const tampered = buf.toString("base64");
    expect(() => decrypt(tampered)).toThrow();
  });
});
