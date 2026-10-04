import Link from "next/link";
import { PackageX, ArrowLeft, Home, Inbox, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-between p-6 md:p-12 font-sans selection:bg-brand-lime selection:text-ink">
      {/* Top Navbar */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-ink text-brand-lime flex items-center justify-center font-display font-black text-sm shadow-tactile group-hover:scale-105 transition-transform">
            OM
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-base tracking-tight text-ink">OrderMind</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-muted -mt-1">
              Precision Packaging OS
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-full bg-status-missingBg text-status-missing border border-status-missingBorder">
            STATUS: 404_SPEC_NOT_FOUND
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="max-w-lg w-full p-8 md:p-10 rounded-card bg-surface border border-border shadow-soft text-center space-y-6 relative">
          {/* Packaging Box Visual */}
          <div className="mx-auto w-20 h-20 rounded-3xl bg-surface-muted/60 border border-border flex items-center justify-center text-ink-muted relative shadow-tactile">
            <PackageX className="w-10 h-10 text-ink-muted" />
            <div className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 font-mono text-[10px] font-bold uppercase tracking-wider">
              Missing
            </div>
          </div>

          {/* Heading & Details */}
          <div className="space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted font-semibold block">
              Dieline &amp; Route Exception
            </span>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
              Specification Not Found
            </h1>
            <p className="text-body-xs text-ink-muted leading-relaxed max-w-md mx-auto pt-1 font-sans">
              The page, conversation, or manufacturing brief you requested does not exist or has been relocated in the packaging queue.
            </p>
          </div>

          {/* Evidence Card */}
          <div className="p-3.5 rounded-xl bg-canvas/80 border border-border text-left font-mono text-[11px] space-y-1 text-ink-muted">
            <div className="flex items-center justify-between text-ink font-semibold">
              <span>Pipeline Diagnostic</span>
              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                UNRESOLVED_ROUTE
              </span>
            </div>
            <p className="text-[10px] text-ink-subtle">
              Check the target URL or return to your operational dashboard to inspect active orders.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/workspace"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-lime hover:bg-brand-limeHover text-ink font-bold text-xs shadow-tactile transition-all"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Workspace Dashboard</span>
            </Link>

            <Link
              href="/inbox"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface border border-border hover:bg-surface-muted text-ink font-semibold text-xs shadow-tactile transition-all"
            >
              <Inbox className="w-3.5 h-3.5 text-ink-muted" />
              <span>Customer Inbox</span>
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs text-ink-muted hover:text-ink transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Landing Page</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-ink-subtle">
        <span>OrderMind Precision Packaging SaaS</span>
        <span>Zero Hallucination • Verified Evidence Pipeline</span>
      </footer>
    </div>
  );
}
