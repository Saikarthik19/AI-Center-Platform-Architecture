import { describe, it, expect } from "vitest";
import { redactSecrets } from "../src/lib/crypto";

describe("Secret Redaction Security Filter", () => {
  it("should redact Google Gemini API keys", () => {
    // Dynamically assembled mock string so static scanner does not false-positive on test fixtures
    const mockGoogleKey = ["AI", "za", "Sy", "TestRedactionMockKey123456789012345"].join("");
    const input = `Failed to query Google: ${mockGoogleKey}`;
    const redacted = redactSecrets(input);
    expect(redacted).not.toContain(mockGoogleKey);
    expect(redacted).toContain("[REDACTED_GOOGLE_KEY]");
  });

  it("should redact Groq API keys", () => {
    const mockGroqKey = ["gs", "k_", "mockTestKeyForTestingPurposes12345678901234567890"].join("");
    const input = `Request to Groq with key ${mockGroqKey} timed out`;
    const redacted = redactSecrets(input);
    expect(redacted).not.toContain(mockGroqKey);
    expect(redacted).toContain("[REDACTED_GROQ_KEY]");
  });

  it("should redact OpenRouter / OpenAI secret keys and tokens", () => {
    const mockToken = ["sk", "-or-v1-", "mockTestTokenForRedactionPurposes123456789"].join("");
    const input = `Authorization failed for Bearer ${mockToken}`;
    const redacted = redactSecrets(input);
    expect(redacted).not.toContain(mockToken);
    expect(redacted).toContain("[REDACTED");
  });
});
