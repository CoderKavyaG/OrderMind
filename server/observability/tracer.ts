import * as Sentry from "@sentry/nextjs";

export type AgentStage =
  | "extract"
  | "interpret"
  | "image"
  | "explain"
  | "retrieval"
  | "validation";

export interface TraceRecord {
  stage: AgentStage;
  model: string;
  latencyMs: number;
  retries: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

// In-memory ring buffer of recent agent traces (accessible via health / observability API)
const TRACE_BUFFER_SIZE = 100;
const traceHistory: TraceRecord[] = [];

let isSentryInitialized = false;

export function initSentryIfConfigured() {
  if (isSentryInitialized) return;

  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (dsn && dsn.trim()) {
    try {
      Sentry.init({
        dsn: dsn.trim(),
        tracesSampleRate: 1.0,
        environment: process.env.NODE_ENV || "development",
        release: "ordermind@0.1.0",
        debug: false,
      });
      console.log("[Observability] Sentry initialized with DSN.");
      isSentryInitialized = true;
    } catch (err) {
      console.warn("[Observability] Failed to initialize Sentry:", err);
    }
  } else {
    // Sentry unset: app works completely fine without it per hard rule
    isSentryInitialized = false;
  }
}

// Automatically attempt init once on module load
initSentryIfConfigured();

export function isSentryActive(): boolean {
  return isSentryInitialized && Boolean((process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)?.trim());
}

export function getRecentTraces(limit: number = 20): TraceRecord[] {
  return traceHistory.slice(-limit).reverse();
}

/**
 * Traces an AI pipeline stage or retrieval operation.
 * Records latency, model, retries, and failures to Sentry and local ring buffer.
 * If Sentry is not configured, silently succeeds and captures local metrics.
 */
export async function traceAgentStage<T>(
  stage: AgentStage,
  options: {
    model?: string;
    metadata?: Record<string, unknown>;
    maxRetries?: number;
  },
  fn: () => Promise<T>
): Promise<T> {
  const model = options.model || process.env.LLM_MODEL || "gemma-2b-it";
  const startTime = Date.now();
  let retries = 0;
  const maxRetries = options.maxRetries ?? 1;

  while (true) {
    try {
      if (isSentryActive()) {
        Sentry.addBreadcrumb({
          category: "ai.agent",
          message: `Starting stage: ${stage}`,
          level: "info",
          data: { stage, model, retries, ...options.metadata },
        });
      }

      const result = await fn();
      const latencyMs = Date.now() - startTime;

      const record: TraceRecord = {
        stage,
        model,
        latencyMs,
        retries,
        success: true,
        metadata: options.metadata,
        timestamp: new Date(),
      };

      pushTrace(record);

      if (isSentryActive()) {
        Sentry.captureMessage(`Agent stage [${stage}] succeeded in ${latencyMs}ms`, {
          level: "info",
          tags: { stage, model, success: "true" },
          extra: { latencyMs, retries, ...options.metadata },
        });
      }

      return result;
    } catch (error: unknown) {
      const isRetryable = retries < maxRetries;
      if (isRetryable) {
        retries++;
        console.warn(`[AgentTracer] Retrying stage "${stage}" (attempt ${retries}/${maxRetries})...`);
        continue;
      }

      const latencyMs = Date.now() - startTime;
      const errMessage = error instanceof Error ? error.message : String(error);

      const record: TraceRecord = {
        stage,
        model,
        latencyMs,
        retries,
        success: false,
        error: errMessage,
        metadata: options.metadata,
        timestamp: new Date(),
      };

      pushTrace(record);

      if (isSentryActive()) {
        Sentry.captureException(error, {
          tags: { stage, model, success: "false" },
          extra: { latencyMs, retries, ...options.metadata },
        });
      }

      throw error;
    }
  }
}

function pushTrace(record: TraceRecord) {
  traceHistory.push(record);
  if (traceHistory.length > TRACE_BUFFER_SIZE) {
    traceHistory.shift();
  }
}
