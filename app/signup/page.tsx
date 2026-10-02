"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      router.push("/onboarding");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

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
          Create Packaging Workspace
        </h1>
        <p className="mt-1.5 text-body-sm text-ink-muted font-sans max-w-sm mx-auto">
          Scaffold a multi-tenant converter hub with deterministic order reducers.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
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
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-subtle">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ishan Kumar"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-muted border border-border text-ink placeholder:text-ink-subtle text-body-sm focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition font-sans"
                />
              </div>
            </div>

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
                  placeholder="ishan@inthebox.pack"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-muted border border-border text-ink placeholder:text-ink-subtle text-body-sm focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-body-xs font-semibold text-ink mb-1.5 font-sans">
                Master Password (min 8 characters)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-subtle">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
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
                <span>Creating Workspace...</span>
              ) : (
                <>
                  <span>Continue to Onboarding</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-border text-center text-body-xs text-ink-muted flex items-center justify-between font-sans">
            <span>Already have an account?</span>
            <Link href="/login" className="text-ink font-bold hover:underline">
              Sign In &rarr;
            </Link>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-ink-subtle font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-limeDark" />
            <span>Encrypted with bcryptjs • Workspace-Scoped MongoDB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
