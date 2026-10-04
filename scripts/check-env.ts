import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

// Load .env.local if present and not already in process.env
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const isProduction = process.env.NODE_ENV === "production";

const EnvCheckSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required to connect to MongoDB Atlas"),
  JWT_SECRET: z
    .string()
    .min(isProduction ? 32 : 8, isProduction ? "JWT_SECRET must be at least 32 characters in production" : "JWT_SECRET is required"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL").default("http://localhost:3000"),
  LLM_PROVIDER: z.enum(["gemma", "mock"]).default("gemma"),
  LLM_BASE_URL: z.string().min(1, "LLM_BASE_URL is required for Gemma").default("http://localhost:11434"),
  LLM_MODEL: z.string().min(1, "LLM_MODEL is required").default("gemma2:9b"),
  LLM_API_KEY: z.string().optional(),
  STT_PROVIDER: z.enum(["elevenlabs", "whisper", "manual"]).default("manual"),
  ELEVENLABS_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  PORT: z.string().default("3000"),
});

export function runEnvCheck(): { pass: boolean; details: Array<{ key: string; status: "PASS" | "FAIL" | "WARN" | "INFO"; note: string }> } {
  const results: Array<{ key: string; status: "PASS" | "FAIL" | "WARN" | "INFO"; note: string }> = [];
  let allPass = true;

  // 1. MONGODB_URI
  if (!process.env.MONGODB_URI || !process.env.MONGODB_URI.trim()) {
    results.push({ key: "MONGODB_URI", status: "FAIL", note: "Missing required database connection string" });
    allPass = false;
  } else {
    const isLocal = process.env.MONGODB_URI.includes("localhost") || process.env.MONGODB_URI.includes("127.0.0.1") || process.env.MONGODB_URI.startsWith("memory://");
    results.push({
      key: "MONGODB_URI",
      status: "PASS",
      note: `Configured (${isLocal ? "local / in-memory instance" : "Atlas Cloud Cluster"})`,
    });
  }

  // 2. JWT_SECRET
  const jwt = process.env.JWT_SECRET || "";
  if (!jwt || jwt.length < (isProduction ? 32 : 8)) {
    results.push({
      key: "JWT_SECRET",
      status: isProduction ? "FAIL" : "WARN",
      note: isProduction ? "Must be at least 32 characters in production" : "Using short/dev secret; set 32+ chars for production",
    });
    if (isProduction) allPass = false;
  } else {
    results.push({ key: "JWT_SECRET", status: "PASS", note: `Configured (${jwt.length} characters)` });
  }

  // 3. NODE_ENV
  const nodeEnv = process.env.NODE_ENV || "development";
  results.push({ key: "NODE_ENV", status: "PASS", note: `Environment: ${nodeEnv}` });

  // 4. LLM_PROVIDER
  const llmProvider = (process.env.LLM_PROVIDER || "gemma").toLowerCase();
  if (isProduction && llmProvider === "mock") {
    results.push({
      key: "LLM_PROVIDER",
      status: "FAIL",
      note: "LLM_PROVIDER=mock is forbidden in production! Must be 'gemma'.",
    });
    allPass = false;
  } else {
    results.push({
      key: "LLM_PROVIDER",
      status: "PASS",
      note: `Active provider: ${llmProvider} ${llmProvider === "mock" ? "(testing only)" : "(open-source pipeline)"}`,
    });
  }

  // 5. LLM_BASE_URL & LLM_MODEL
  const llmBase = process.env.LLM_BASE_URL || "http://localhost:11434";
  const llmModel = process.env.LLM_MODEL || "gemma2:9b";
  const isOllama = llmBase.includes("11434");
  results.push({
    key: "LLM_BASE_URL",
    status: "PASS",
    note: `${llmBase} (${isOllama ? "Local Ollama" : "Hosted OpenAI-compatible endpoint"})`,
  });
  results.push({ key: "LLM_MODEL", status: "PASS", note: `Model tag: ${llmModel}` });

  // 6. LLM_API_KEY
  if (!isOllama && (!process.env.LLM_API_KEY || !process.env.LLM_API_KEY.trim())) {
    results.push({
      key: "LLM_API_KEY",
      status: "WARN",
      note: "Hosted endpoint configured but LLM_API_KEY is unset (may fail if authentication is required)",
    });
  } else {
    results.push({
      key: "LLM_API_KEY",
      status: "PASS",
      note: isOllama ? "Not required for local Ollama" : "API key configured",
    });
  }

  // 7. STT_PROVIDER & ELEVENLABS_API_KEY
  const stt = process.env.STT_PROVIDER || "manual";
  if (stt === "elevenlabs" && !process.env.ELEVENLABS_API_KEY) {
    results.push({
      key: "ELEVENLABS_API_KEY",
      status: "FAIL",
      note: "STT_PROVIDER is set to 'elevenlabs' but ELEVENLABS_API_KEY is missing",
    });
    allPass = false;
  } else {
    results.push({
      key: "STT_PROVIDER",
      status: "PASS",
      note: `Speech-to-text mode: ${stt} (${stt === "elevenlabs" ? "ElevenLabs Scribe API" : "Manual text transcription fallback"})`,
    });
  }

  // 8. SENTRY_DSN
  if (process.env.SENTRY_DSN && process.env.SENTRY_DSN.trim()) {
    results.push({ key: "SENTRY_DSN", status: "PASS", note: "Sentry APM & Agent tracing active" });
  } else {
    results.push({ key: "SENTRY_DSN", status: "INFO", note: "Unset (tracing degrades gracefully without error)" });
  }

  // 9. NEXT_PUBLIC_APP_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  results.push({ key: "NEXT_PUBLIC_APP_URL", status: "PASS", note: appUrl });

  return { pass: allPass, details: results };
}

// Execute CLI
if (require.main === module || process.argv[1]?.includes("check-env")) {
  console.log("\n========================================================");
  console.log("       OrderMind Environment Configuration Audit");
  console.log("========================================================\n");

  const check = runEnvCheck();

  for (const item of check.details) {
    const badge =
      item.status === "PASS"
        ? "\x1b[32m[PASS]\x1b[0m"
        : item.status === "WARN"
        ? "\x1b[33m[WARN]\x1b[0m"
        : item.status === "INFO"
        ? "\x1b[36m[INFO]\x1b[0m"
        : "\x1b[31m[FAIL]\x1b[0m";
    console.log(` ${badge} ${item.key.padEnd(26)} : ${item.note}`);
  }

  console.log("\n--------------------------------------------------------");
  if (check.pass) {
    console.log("\x1b[32m✔ Environment check PASSED. Ready to boot.\x1b[0m\n");
    process.exit(0);
  } else {
    console.error("\x1b[31m✖ Environment check FAILED. Required variables missing or invalid.\x1b[0m\n");
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
}
