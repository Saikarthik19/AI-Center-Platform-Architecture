import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword, createSessionToken, verifySessionToken } from "../src/lib/auth";

describe("Authentication & Session Vault", () => {
  it("should hash and verify passwords using bcrypt", async () => {
    const raw = "SuperSecretDeveloperPass123!";
    const hash = await hashPassword(raw);

    expect(hash).not.toBe(raw);
    const valid = await comparePassword(raw, hash);
    expect(valid).toBe(true);

    const wrong = await comparePassword("WrongPassword!", hash);
    expect(wrong).toBe(false);
  });

  it("should create and verify JWT session tokens", async () => {
    const user = {
      id: "usr_12345",
      email: "engineer@aicenter.dev",
      name: "Engineer",
      role: "USER" as const,
    };

    const token = await createSessionToken(user);
    expect(token).toBeDefined();

    const verified = await verifySessionToken(token);
    expect(verified).toBeDefined();
    expect(verified?.id).toBe(user.id);
    expect(verified?.email).toBe(user.email);
  });
});
