import { z } from "zod";

const EnvSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(8, "JWT_SECRET must be at least 8 characters").default("development_secret_key_change_in_production_12345"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().optional().default("3000"),
  LLM_BASE_URL: z.string().optional(),
  LLM_MODEL: z.string().optional().default("gemma2:9b"),
  LLM_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export type ValidatedEnv = z.infer<typeof EnvSchema>;

let cachedEnv: ValidatedEnv | null = null;

export function getValidatedEnv(): ValidatedEnv {
  if (cachedEnv) return cachedEnv;

  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    console.warn(`[OrderMind Config Warning] Environment variables validation notice:\n${issues}`);
    // In dev / test, provide safe fallback
    return {
      MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/ordermind_dev",
      JWT_SECRET: process.env.JWT_SECRET || "development_secret_key_change_in_production_12345",
      NODE_ENV: (process.env.NODE_ENV as any) || "development",
      PORT: process.env.PORT || "3000",
      LLM_MODEL: process.env.LLM_MODEL || "gemma2:9b",
    };
  }

  cachedEnv = result.data;
  return cachedEnv;
}
