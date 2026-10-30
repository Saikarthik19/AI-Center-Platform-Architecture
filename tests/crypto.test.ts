import { describe, it, expect } from "vitest";
import { encryptApiKey, decryptApiKey, maskApiKey } from "../src/lib/crypto";

describe("AES-256-GCM Cryptographic Key Vault", () => {
  it("should encrypt and successfully decrypt an API key", () => {
    const originalKey = "gsk_test_api_key_sample_secret_123456789";
    const encrypted = encryptApiKey(originalKey);

    expect(encrypted.encryptedKey).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.authTag).toBeDefined();
    expect(encrypted.encryptedKey).not.toContain(originalKey);

    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe(originalKey);
  });

  it("should fail decryption when authentication tag is tampered with", () => {
    const originalKey = "test_key_fixture_for_tamper_verification_987654321";
    const encrypted = encryptApiKey(originalKey);

    // Tamper with the auth tag
    const tampered = {
      ...encrypted,
      authTag: Buffer.from("tampered_tag_16b").toString("base64"),
    };

    expect(() => decryptApiKey(tampered)).toThrow();
  });

  it("should mask API keys cleanly without exposing secrets", () => {
    expect(maskApiKey("demo_1234567890abcdef")).toBe("demo_...cdef");
    expect(maskApiKey("samplekeylongerthaneight")).toBe("sam...ight");
    expect(maskApiKey("short")).toBe("••••••••");
  });
});
