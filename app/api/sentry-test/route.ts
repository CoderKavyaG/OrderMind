import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const shouldError = url.searchParams.get("error") === "true";
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

  const isConfigured = Boolean(dsn && dsn.trim());

  if (!isConfigured) {
    return NextResponse.json(
      {
        status: "unconfigured",
        message: "Sentry DSN is not set. Add SENTRY_DSN in your environment variables to enable error monitoring.",
        instructions: {
          step1: "Create a free project on https://sentry.io (Platform: Next.js)",
          step2: "Copy your DSN from Project Settings > Client Keys (DSN)",
          step3: "Add SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project> to your .env.local or Render environment",
        },
      },
      { status: 200 }
    );
  }

  try {
    let eventId: string;

    if (shouldError) {
      const testError = new Error("OrderMind Sentry Test Exception: Verification of error pipeline");
      eventId = Sentry.captureException(testError, {
        tags: { test: "true", trigger: "manual_api_call" },
        extra: { timestamp: new Date().toISOString() },
      });
    } else {
      eventId = Sentry.captureMessage("OrderMind Sentry Test Message: Verification of telemetry pipeline", {
        level: "info",
        tags: { test: "true", trigger: "manual_api_call" },
        extra: { timestamp: new Date().toISOString() },
      });
    }

    return NextResponse.json({
      status: "success",
      message: shouldError
        ? "Test exception captured and dispatched to Sentry!"
        : "Test message captured and dispatched to Sentry!",
      eventId,
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        status: "error",
        message: `Failed to dispatch event to Sentry: ${errorMsg}`,
      },
      { status: 500 }
    );
  }
}
