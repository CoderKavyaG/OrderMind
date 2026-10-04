"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock, Mail, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const rawFrom = searchParams.get("from");
  const from =
    rawFrom && rawFrom.startsWith("/") && !rawFrom.startsWith("//") && !rawFrom.includes(":")
      ? rawFrom
      : "/workspace";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.user?.needsOnboarding) {
        router.push("/onboarding");
      } else {
        router.push(from === "/" ? "/workspace" : from);
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-card-lg bg-surface border border-border p-8 sm:p-10 shadow-floating">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-body-xs font-medium text-rose-700 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-body-xs font-semibold text-ink mb-1.5 font-sans">
            Work Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-subtle">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="demo@ordermind.pack"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-muted border border-border text-ink placeholder:text-ink-subtle text-body-sm focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition font-sans"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-body-xs font-semibold text-ink font-sans">
              Password
            </label>
            <span className="text-body-xs text-ink-muted hover:text-ink cursor-pointer font-sans">
              Forgot password?
            </span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-subtle">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="password123"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-muted border border-border text-ink placeholder:text-ink-subtle text-body-sm focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition font-sans"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full mt-2 h-11 rounded-full bg-brand-lime text-slate-950 font-bold hover:bg-brand-limeHover border border-[#BDE82B] shadow-tactile text-body-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <span>Authenticating...</span>
          ) : (
            <>
              <span>Sign In to Workspace</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-border text-center text-body-xs text-ink-muted flex items-center justify-between font-sans">
        <span>Don&apos;t have a workspace?</span>
        <Link href="/signup" className="text-ink font-bold hover:underline">
          Create Workspace &rarr;
        </Link>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-ink-subtle font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-brand-limeDark" />
        <span>httpOnly Session Cookies • Zero LocalStorage Tokens</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative font-sans selection:bg-brand-lime selection:text-ink">
      {/* Top Left Navigation Back */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-body-xs font-mono text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 px-4">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-lime text-ink shadow-tactile font-display font-extrabold text-lg border border-[#BDE82B] transition-transform group-hover:scale-105">
            OM
          </div>
          <span className="font-display text-heading-md font-bold tracking-tight text-ink">
            OrderMind
          </span>
        </Link>
        <h1 className="font-display text-display-xs sm:text-display-sm font-bold tracking-tight text-ink">
          Sign In to Packaging Workspace
        </h1>
        <p className="mt-1.5 text-body-sm text-ink-muted font-sans max-w-sm mx-auto">
          Access customer message feeds, extracted claims, and locked production briefs.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <Suspense
          fallback={
            <div className="p-8 rounded-card-lg bg-surface border border-border text-center text-body-xs text-ink-muted shadow-floating">
              Loading authentication...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
