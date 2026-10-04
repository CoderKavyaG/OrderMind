import { describe, it, expect } from "vitest";
import { SignupInputSchema, LoginInputSchema } from "@/server/services/auth.service";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/server/auth/rate-limit";

describe("Auth Input Validation & Rate Limiting", () => {
  it("validates successful signup input", () => {
    const valid = {
      name: "Vikram Sharma",
      email: "vikram@apexpack.com",
      password: "StrongPassword88",
    };
    const parsed = SignupInputSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid email formats", () => {
    const invalid = {
      name: "Vikram",
      email: "not-an-email",
      password: "StrongPassword88",
    };
    const parsed = SignupInputSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("enforces minimum password length of 8 characters", () => {
    const invalid = {
      name: "Vikram",
      email: "vikram@apexpack.com",
      password: "short",
    };
    const parsed = SignupInputSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.errors[0].message).toContain("at least 8 characters");
    }
  });

  it("validates login input correctly", () => {
    const valid = { email: "admin@apexpack.com", password: "some-password" };
    expect(LoginInputSchema.safeParse(valid).success).toBe(true);

    const empty = { email: "admin@apexpack.com", password: "" };
    expect(LoginInputSchema.safeParse(empty).success).toBe(false);
  });

  it("rate limits rapid consecutive login attempts", () => {
    const testKey = "192.168.1.1:test@example.com";
    resetLoginRateLimit(testKey);

    // 5 attempts allowed
    for (let i = 0; i < 5; i++) {
      const res = checkLoginRateLimit(testKey, 5, 10000);
      expect(res.allowed).toBe(true);
    }

    // 6th attempt should be blocked
    const blocked = checkLoginRateLimit(testKey, 5, 10000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);

    // Resetting unblocks
    resetLoginRateLimit(testKey);
    const afterReset = checkLoginRateLimit(testKey, 5, 10000);
    expect(afterReset.allowed).toBe(true);
  });
});
