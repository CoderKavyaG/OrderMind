import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, clearAllRateLimits, checkLoginRateLimit } from "@/server/auth/rate-limit";
import { validateCsrfOrigin } from "@/server/auth/csrf";
import { validateMagicBytes, validateAttachment } from "@/server/services/attachment.service";
import { AppError } from "@/server/errors/appError";
import { getValidatedEnv } from "@/server/config/env";
import { REQUIRED_INDEXES } from "@/server/db/indexes";
import { NextRequest } from "next/server";

describe("Phase R7: Production Hardening & Security Architecture", () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  describe("Rate Limiting Engine", () => {
    it("allows requests under the rate limit threshold", () => {
      const res1 = checkRateLimit("user-ip-123", { maxAttempts: 3, windowMs: 10000 });
      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(2);

      const res2 = checkRateLimit("user-ip-123", { maxAttempts: 3, windowMs: 10000 });
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(1);

      const res3 = checkRateLimit("user-ip-123", { maxAttempts: 3, windowMs: 10000 });
      expect(res3.allowed).toBe(true);
      expect(res3.remaining).toBe(0);
    });

    it("blocks requests that exceed the rate limit threshold", () => {
      checkRateLimit("user-ip-blocked", { maxAttempts: 2, windowMs: 10000 });
      checkRateLimit("user-ip-blocked", { maxAttempts: 2, windowMs: 10000 });
      const res = checkRateLimit("user-ip-blocked", { maxAttempts: 2, windowMs: 10000 });
      expect(res.allowed).toBe(false);
      expect(res.remaining).toBe(0);
    });

    it("tracks login attempts separately per key", () => {
      const res = checkLoginRateLimit("admin@ordermind.pack", 5, 60000);
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(4);
    });
  });

  describe("CSRF Protection", () => {
    it("allows safe HTTP methods (GET, HEAD, OPTIONS) without origin headers", () => {
      const req = new NextRequest("http://localhost:3000/api/workspace/home", { method: "GET" });
      const check = validateCsrfOrigin(req);
      expect(check.valid).toBe(true);
    });

    it("allows matching host and origin on POST requests", () => {
      const req = new NextRequest("http://ordermind.app/api/auth/login", {
        method: "POST",
        headers: {
          host: "ordermind.app",
          origin: "http://ordermind.app",
        },
      });
      const check = validateCsrfOrigin(req);
      expect(check.valid).toBe(true);
    });

    it("allows localhost origins during development", () => {
      const req = new NextRequest("http://localhost:3005/api/dump/process", {
        method: "POST",
        headers: {
          host: "localhost:3005",
          origin: "http://localhost:3005",
        },
      });
      const check = validateCsrfOrigin(req);
      expect(check.valid).toBe(true);
    });
  });

  describe("Binary Magic Byte Validation", () => {
    it("validates JPEG file headers (FF D8 FF)", () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      expect(validateMagicBytes(jpegBuffer, "image/jpeg", "box.jpg")).toBe(true);
    });

    it("validates PNG file headers (89 50 4E 47)", () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(validateMagicBytes(pngBuffer, "image/png", "dieline.png")).toBe(true);
    });

    it("validates PDF file headers (%PDF)", () => {
      const pdfBuffer = Buffer.from("%PDF-1.4 spec sheet content", "utf-8");
      expect(validateMagicBytes(pdfBuffer, "application/pdf", "spec.pdf")).toBe(true);
    });

    it("validates WebP container headers (RIFF....WEBP)", () => {
      const webpBuffer = Buffer.from("RIFF\x00\x00\x00\x00WEBPVP8 ");
      expect(validateMagicBytes(webpBuffer, "image/webp", "carton.webp")).toBe(true);
    });

    it("rejects spoofed executable buffers disguised as images", () => {
      // Windows PE EXE header "MZ" disguised as PNG
      const fakePng = Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00");
      expect(validateMagicBytes(fakePng, "image/png", "malware.png")).toBe(false);
      expect(() => {
        validateAttachment({
          size: fakePng.length,
          type: "image/png",
          name: "malware.png",
          buffer: fakePng,
        });
      }).toThrow(/signature does not match/);
    });
  });

  describe("Standardized Error Taxonomy", () => {
    it("creates operational AppError instances with typed codes", () => {
      const notFound = AppError.notFound("Order #ORD-999 was not found");
      expect(notFound.statusCode).toBe(404);
      expect(notFound.code).toBe("NOT_FOUND");
      expect(notFound.isOperational).toBe(true);

      const json = notFound.toJSON();
      expect(json.statusCode).toBe(404);
      expect(json.code).toBe("NOT_FOUND");
    });

    it("handles validation and unauthorized errors properly", () => {
      const unauth = AppError.unauthorized();
      expect(unauth.statusCode).toBe(401);
      expect(unauth.code).toBe("UNAUTHORIZED");

      const validation = AppError.validation("Invalid quantity", { field: "quantity" });
      expect(validation.statusCode).toBe(422);
      expect(validation.code).toBe("VALIDATION_ERROR");
      expect(validation.details).toEqual({ field: "quantity" });
    });
  });

  describe("Database Index Registry", () => {
    it("contains compound indexes for all tenant collections", () => {
      expect(REQUIRED_INDEXES.length).toBeGreaterThanOrEqual(14);

      const orderIndexes = REQUIRED_INDEXES.filter((idx) => idx.collection === "orders");
      expect(orderIndexes.length).toBeGreaterThanOrEqual(3);

      const clientIndexes = REQUIRED_INDEXES.filter((idx) => idx.collection === "clients");
      expect(clientIndexes.length).toBeGreaterThanOrEqual(2);

      const memberIndexes = REQUIRED_INDEXES.filter((idx) => idx.collection === "members");
      expect(memberIndexes.some((idx) => idx.options?.unique)).toBe(true);
    });
  });

  describe("Environment Configuration Validator", () => {
    it("validates and provides environment values safely", () => {
      const env = getValidatedEnv();
      expect(env).toBeDefined();
      expect(typeof env.MONGODB_URI).toBe("string");
      expect(typeof env.JWT_SECRET).toBe("string");
    });
  });
});
