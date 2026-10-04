"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";
import { Menu, X } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

interface UserState {
  user?: {
    id: string;
    name: string;
    email: string;
  };
  activeWorkspace?: {
    id: string;
    name: string;
    industry: string;
    role: string;
  };
}

export function AppShell({ children, title }: AppShellProps) {
  const router = useRouter();
  const [data, setData] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    async function loadAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const json = await res.json();
        if (!json.activeWorkspace) {
          router.push("/onboarding");
          return;
        }
        setData(json);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    loadAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-ink border-t-brand-lime rounded-full animate-spin"></div>
          <div className="text-xs text-ink-muted font-mono tracking-tight font-medium">Initializing OrderMind session...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F0F2F5] overflow-hidden text-ink font-sans">
      {/* Desktop Sidebar Rail */}
      <div className="hidden md:flex pl-4 py-3">
        <Sidebar
          workspaceName={data?.activeWorkspace?.name}
          industry={data?.activeWorkspace?.industry}
          role={data?.activeWorkspace?.role}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 flex flex-col w-64 h-full bg-surface shadow-2xl border-r border-border">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-md text-ink-muted hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>
            <Sidebar
              workspaceName={data?.activeWorkspace?.name}
              industry={data?.activeWorkspace?.industry}
              role={data?.activeWorkspace?.role}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between px-3 py-2 border-b border-border bg-surface">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-md hover:bg-surface-muted text-ink"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold font-display">{data?.activeWorkspace?.name || "OrderMind"}</span>
          <div className="w-6" />
        </div>

        <Topbar
          user={data?.user}
          workspace={data?.activeWorkspace}
          title={title}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        <main className="flex-1 overflow-auto bg-canvas">
          {children}
        </main>
      </div>

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </div>
  );
}
