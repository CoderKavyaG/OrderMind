import { NextResponse } from "next/server";
import { getDb } from "@/server/db/mongodb";
import { isSentryActive, getRecentTraces } from "@/server/observability/tracer";
import { getLLMProvider } from "@/server/ai";

export async function GET() {
  let dbStatus = "unknown";
  let collectionsCount = 0;

  try {
    const db = await getDb();
    const cols = await db.listCollections().toArray().catch(() => []);
    dbStatus = "connected";
    collectionsCount = cols.length;
  } catch (err) {
    dbStatus = `disconnected (${(err as Error).message})`;
  }

  const llm = getLLMProvider();
  const sentryConfigured = Boolean(process.env.SENTRY_DSN && process.env.SENTRY_DSN.trim());

  let llmReachable = false;
  let llmError: string | null = null;
  if (llm.checkReachable) {
    try {
      const probe = await llm.checkReachable();
      llmReachable = probe.reachable;
      if (probe.error) llmError = probe.error;
    } catch (e) {
      llmReachable = false;
      llmError = (e as Error).message;
    }
  } else {
    llmReachable = true; // MockProvider is in-memory
  }

  const isOk = dbStatus === "connected";

  return NextResponse.json({
    status: isOk ? "ok" : "degraded",
    service: "OrderMind Precision Packaging SaaS",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      collections: collectionsCount,
    },
    observability: {
      sentry: {
        configured: sentryConfigured,
        active: isSentryActive(),
      },
      recentTraces: getRecentTraces(10),
    },
    ai: {
      provider: llm.providerName,
      model: llm.modelName,
      reachable: llmReachable,
      lastSuccessfulCallTime: llm.lastSuccessfulCallTime || null,
      error: llmError,
    },
  }, {
    status: isOk ? 200 : 503,
  });
}
