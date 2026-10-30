import { describe, it, expect } from "vitest";
import { validateTargetUrl, normalizeProviderError } from "../src/lib/providers/ssrf";

describe("SSRF Protection & Error Normalization", () => {
  it("should permit official trusted AI endpoints", () => {
    expect(() =>
      validateTargetUrl("https://generativelanguage.googleapis.com/v1beta/models")
    ).not.toThrow();

    expect(() =>
      validateTargetUrl("https://api.groq.com/openai/v1/chat/completions")
    ).not.toThrow();

    expect(() =>
      validateTargetUrl("https://openrouter.ai/api/v1/chat/completions")
    ).not.toThrow();
  });

  it("should block non-HTTPS protocols", () => {
    expect(() =>
      validateTargetUrl("http://api.groq.com/openai/v1/models")
    ).toThrow("Only HTTPS requests are permitted");
  });

  it("should block private IP and localhost SSRF vectors", () => {
    expect(() =>
      validateTargetUrl("https://localhost:8080/api")
    ).toThrow("SSRF Block");

    expect(() =>
      validateTargetUrl("https://127.0.0.1:5432")
    ).toThrow("SSRF Block");

    expect(() =>
      validateTargetUrl("https://169.254.169.254/latest/meta-data")
    ).toThrow("SSRF Block");

    expect(() =>
      validateTargetUrl("https://malicious-attacker.com/steal-keys")
    ).toThrow("SSRF Block");
  });

  it("should normalize provider rate-limit errors cleanly", () => {
    const error = new Error("HTTP 429: Resource has been exhausted (rate_limit_exceeded)");
    const normalized = normalizeProviderError(error, "Google Gemini");
    expect(normalized.statusCode).toBe(429);
    expect(normalized.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(normalized.suggestedAction).toContain("Wait a minute or check your plan billing/quota");
  });
});
