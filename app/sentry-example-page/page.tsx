"use client";

import React, { useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, Bug, CheckCircle2, Server, ArrowLeft, ExternalLink, ShieldCheck, Activity } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function SentryExamplePage() {
  const [serverStatus, setServerStatus] = useState<string | null>(null);
  const [loadingServer, setLoadingServer] = useState(false);
  const dsnPresent = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

  const triggerUnhandledError = () => {
    // Deliberately trigger sample error as specified in Sentry documentation
    // @ts-expect-error deliberately invoking undefined function to verify Sentry capture
    window.myUndefinedFunction();
  };

  const triggerHandledError = () => {
    try {
      throw new Error("OrderMind Packaging Engine: Sample Diagnostic Exception captured successfully.");
    } catch (err) {
      const eventId = Sentry.captureException(err, {
        tags: {
          component: "sentry-example-page",
          pipeline: "packaging-intake",
          org: "goelsahhab-workspace",
          project: "javascript-nextjs",
        },
        extra: {
          timestamp: new Date().toISOString(),
          context: "Verification of Sentry Next.js client error pipeline",
        },
      });
      alert(`Diagnostic exception sent to Sentry! Event ID: ${eventId || "captured"}`);
    }
  };

  const triggerServerError = async () => {
    setLoadingServer(true);
    setServerStatus(null);
    try {
      const res = await fetch("/api/sentry-test?error=true");
      const data = await res.json();
      setServerStatus(
        `Server responded (${res.status}): ${data.message || JSON.stringify(data)} (Event ID: ${
          data.sentryEventId || "Logged"
        })`
      );
    } catch (err) {
      setServerStatus(`Failed to reach server test endpoint: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingServer(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink p-6 md:p-12 font-sans selection:bg-brand-lime selection:text-ink">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
          <Link
            href="/workspace"
            className="inline-flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-ink transition-colors bg-surface px-3 py-1.5 rounded-lg border border-border shadow-soft w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Workspace
          </Link>

          <a
            href="https://goelsahhab-workspace.sentry.io/issues/?project=javascript-nextjs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink bg-brand-lime hover:bg-brand-limeHover px-3 py-1.5 rounded-lg border border-brand-limeHover shadow-tactile transition-all w-fit"
          >
            <span>Open Sentry Issues</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Hero Card */}
        <div className="bg-surface border border-border rounded-card p-6 md:p-8 space-y-6 shadow-soft">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-lime text-ink flex items-center justify-center font-bold shadow-tactile border border-brand-limeHover shrink-0">
              <Bug className="w-6 h-6 text-ink" />
            </div>
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted font-semibold block">
                Observability &amp; Distributed Tracing
              </span>
              <h1 className="text-xl md:text-2xl font-display font-extrabold text-ink tracking-tight mt-0.5">
                Sentry Next.js Telemetry Verification
              </h1>
              <p className="text-body-xs text-ink-muted mt-1">
                Workspace: <span className="font-mono font-semibold text-ink">goelsahhab-workspace</span> &bull; Project:{" "}
                <span className="font-mono font-semibold text-ink">javascript-nextjs</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 bg-surface-muted/50 rounded-xl border border-border flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-confirmedBg text-status-confirmed border border-status-confirmedBorder shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-ink">Client Tracing SDK</p>
                <p className="text-ink-muted font-mono text-[11px]">@sentry/nextjs Active (v11.4)</p>
              </div>
            </div>

            <div className="p-4 bg-surface-muted/50 rounded-xl border border-border flex items-center gap-3">
              <div
                className={`p-2 rounded-lg border shrink-0 ${
                  dsnPresent
                    ? "bg-status-confirmedBg text-status-confirmed border-status-confirmedBorder"
                    : "bg-status-inferredBg text-status-inferred border-status-inferredBorder"
                }`}
              >
                {dsnPresent ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              </div>
              <div className="text-xs">
                <p className="font-bold text-ink">
                  {dsnPresent ? "Sentry DSN Configured" : "Awaiting DSN"}
                </p>
                <p className="text-ink-muted font-mono text-[11px]">
                  {dsnPresent ? "Capturing real-time telemetry" : "Set NEXT_PUBLIC_SENTRY_DSN"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-surface border border-border rounded-card p-6 md:p-8 space-y-6 shadow-soft">
          <div className="flex items-center gap-2 text-body-sm font-display font-bold text-ink">
            <Activity className="w-4 h-4 text-brand-lime" />
            <span>Trigger Diagnostic Events</span>
          </div>

          <p className="text-body-xs text-ink-muted leading-relaxed font-sans">
            Exercise any of the test buttons below to emit a real diagnostic event. Sentry records the stack trace,
            route parameters, browser details, and environment context directly to your dashboard.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* 1. Unhandled Error */}
            <div className="p-5 bg-surface-muted/30 border border-border rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 block w-fit mb-2">
                  Test 1
                </span>
                <p className="text-sm font-bold text-ink">Unhandled Crash</p>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Directly calls <code className="font-mono text-rose-700 bg-rose-50 px-1 py-0.5 rounded">myUndefinedFunction()</code> to test global error boundary.
                </p>
              </div>

              <button
                type="button"
                onClick={triggerUnhandledError}
                className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-tactile"
              >
                Break Client (Crash)
              </button>
            </div>

            {/* 2. Handled Sentry Event */}
            <div className="p-5 bg-surface-muted/30 border border-border rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 block w-fit mb-2">
                  Test 2
                </span>
                <p className="text-sm font-bold text-ink">Handled Exception</p>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Dispatches <code className="font-mono text-purple-700 bg-purple-50 px-1 py-0.5 rounded">Sentry.captureException</code> with custom tags &amp; metadata.
                </p>
              </div>

              <button
                type="button"
                onClick={triggerHandledError}
                className="w-full py-2 px-3 bg-brand-lime hover:bg-brand-limeHover text-ink border border-brand-limeHover rounded-lg text-xs font-bold transition shadow-tactile"
              >
                Capture Handled Error
              </button>
            </div>

            {/* 3. Server API Error */}
            <div className="p-5 bg-surface-muted/30 border border-border rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 block w-fit mb-2">
                  Test 3
                </span>
                <p className="text-sm font-bold text-ink flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-blue-600" /> Server API Route
                </p>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Calls <code className="font-mono text-blue-700 bg-blue-50 px-1 py-0.5 rounded">/api/sentry-test</code> to test server runtime error capture.
                </p>
              </div>

              <button
                type="button"
                disabled={loadingServer}
                onClick={triggerServerError}
                className="w-full py-2 px-3 bg-surface hover:bg-surface-muted disabled:opacity-50 text-ink border border-border rounded-lg text-xs font-bold transition shadow-tactile"
              >
                {loadingServer ? "Testing Server..." : "Trigger Server Error"}
              </button>
            </div>
          </div>

          {serverStatus && (
            <div className="p-4 bg-surface-muted/70 rounded-xl border border-border text-xs font-mono text-ink space-y-1">
              <span className="font-bold text-ink-muted uppercase text-[10px] block">Server Response:</span>
              <p>{serverStatus}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
