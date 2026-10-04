import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/passwords";

describe("Password Security & Hashing", () => {
  it("hashes password with salt rounds and does not store plaintext", async () => {
    const raw = "SuperSecretPassword123!";
    const hash = await hashPassword(raw);

    expect(hash).not.toBe(raw);
    expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);
  });

  it("verifies matching password correctly", async () => {
    const raw = "PackagingOrders2024#";
    const hash = await hashPassword(raw);

    const match = await verifyPassword(raw, hash);
    expect(match).toBe(true);
  });

  it("rejects mismatched passwords", async () => {
    const raw = "CorrectPassword123";
    const hash = await hashPassword(raw);

    const match = await verifyPassword("WrongPassword456", hash);
    expect(match).toBe(false);
  });
});
