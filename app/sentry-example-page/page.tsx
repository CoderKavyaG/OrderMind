"use client";

import React, { useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, Bug, CheckCircle2, Server, ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";

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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/workspace"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <a
            href="https://goelsahhab-workspace.sentry.io/issues/?project=javascript-nextjs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
          >
            Open Sentry Dashboard <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Header */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Bug className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Sentry Next.js Verification
              </h1>
              <p className="text-sm text-slate-400">
                Workspace: <span className="text-slate-200 font-mono">goelsahhab-workspace</span> | Project:{" "}
                <span className="text-slate-200 font-mono">javascript-nextjs</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-slate-200">Client Tracing SDK</p>
                <p className="text-slate-400">@sentry/nextjs Active</p>
              </div>
            </div>
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center gap-3">
              {dsnPresent ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div className="text-xs">
                <p className="font-semibold text-slate-200">
                  {dsnPresent ? "Sentry DSN Configured" : "DSN Ready"}
                </p>
                <p className="text-slate-400">
                  {dsnPresent ? "Capturing real-time telemetry" : "Awaiting NEXT_PUBLIC_SENTRY_DSN"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Trigger Test Diagnostics
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Click any of the test buttons below to trigger an error. Sentry will capture the stack trace, metadata,
            and route context and display them in your Sentry Issues dashboard.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Unhandled Error Button */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <p className="text-sm font-semibold text-rose-400">1. Unhandled Client Error</p>
                <p className="text-xs text-slate-400 mt-1">
                  Calls <code className="text-rose-300 bg-rose-950/50 px-1 py-0.5 rounded">myUndefinedFunction()</code> directly.
                </p>
              </div>
              <button
                type="button"
                onClick={triggerUnhandledError}
                className="w-full py-2.5 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold transition"
              >
                Break Client (Crash)
              </button>
            </div>

            {/* Handled Exception Button */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-400">2. Handled Sentry Event</p>
                <p className="text-xs text-slate-400 mt-1">
                  Invokes <code className="text-purple-300 bg-purple-950/50 px-1 py-0.5 rounded">Sentry.captureException</code> with custom tags.
                </p>
              </div>
              <button
                type="button"
                onClick={triggerHandledError}
                className="w-full py-2.5 px-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold transition"
              >
                Capture Handled Error
              </button>
            </div>

            {/* Server-Side Error Button */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-400 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" /> 3. Server API Error
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Hits <code className="text-blue-300 bg-blue-950/50 px-1 py-0.5 rounded">/api/sentry-test</code> server route.
                </p>
              </div>
              <button
                type="button"
                disabled={loadingServer}
                onClick={triggerServerError}
                className="w-full py-2.5 px-3 bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-50 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold transition"
              >
                {loadingServer ? "Testing Server..." : "Trigger Server Error"}
              </button>
            </div>
          </div>

          {serverStatus && (
            <div className="p-3.5 bg-slate-950 rounded-xl border border-blue-500/30 text-xs font-mono text-blue-300">
              {serverStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
