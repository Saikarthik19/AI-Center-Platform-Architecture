import { describe, it, expect } from "vitest";
import { providerRegistry } from "../src/lib/providers/registry";

describe("Provider Registry & Adapters", () => {
  it("should contain all 6 initial provider adapters", () => {
    const required = ["google", "groq", "openrouter", "mistral", "cloudflare", "huggingface"];
    for (const slug of required) {
      const adapter = providerRegistry.get(slug);
      expect(adapter).toBeDefined();
      expect(adapter?.slug).toBe(slug);
      expect(adapter?.docsUrl).toBeDefined();
      expect(adapter?.keySignupUrl).toBeDefined();
    }
  });

  it("should fail gracefully when testing invalid credentials", async () => {
    const groqAdapter = providerRegistry.get("groq")!;
    const result = await groqAdapter.testConnection("gsk_completely_invalid_key_testing_12345");
    expect(result.success).toBe(false);
    expect(result.message).toBeDefined();
  });
});
