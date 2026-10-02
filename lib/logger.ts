type LogLevel = "debug" | "info" | "warn" | "error";

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "jwt",
  "secret",
  "authorization",
  "cookie",
  "apiKey",
  "api_key",
  "elevenlabs_api_key",
  "gemini_api_key",
]);

function redact(obj: unknown, depth = 0): unknown {
  if (depth > 4 || obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    // Redact JWT patterns
    if (obj.startsWith("Bearer ") || /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(obj)) {
      return "[REDACTED_JWT]";
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redact(item, depth + 1));
  }

  if (typeof obj === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        cleaned[key] = "[REDACTED]";
      } else {
        cleaned[key] = redact(val, depth + 1);
      }
    }
    return cleaned;
  }

  return obj;
}

class Logger {
  private format(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      level,
      message,
      ...(meta ? { meta: redact(meta) } : {}),
    };

    return JSON.stringify(payload);
  }

  debug(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.format("debug", message, meta));
    }
  }

  info(message: string, meta?: Record<string, unknown>) {
    console.info(this.format("info", message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(this.format("warn", message, meta));
  }

  error(message: string, error?: unknown, meta?: Record<string, unknown>) {
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    } : { rawError: String(error) };

    console.error(this.format("error", message, { ...meta, error: errorDetails }));
  }
}

export const logger = new Logger();
