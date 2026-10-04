"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronDown,
  Search,
  Plus,
  LogOut,
  Building2,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TopbarProps {
  user?: {
    name: string;
    email: string;
  };
  workspace?: {
    id: string;
    name: string;
    industry: string;
    role?: string;
  };
  title?: string;
  onOpenCommandPalette?: () => void;
}

export function Topbar({
  user,
  workspace,
  title = "Dashboard",
  onOpenCommandPalette,
}: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to sign out");
    }
  };

  return (
    <header className="h-14 border-b border-border bg-surface/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between flex-shrink-0 select-none z-20">
      {/* Left: Workspace Switcher Pill & Page Title */}
      <div className="flex items-center gap-3">
        {/* Workspace Switcher Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-elevated border border-border shadow-tactile text-body-xs font-semibold text-ink hover:bg-surface-muted transition-colors"
          >
            <div className="h-2 w-2 rounded-full bg-brand-lime" />
            <span className="truncate max-w-[140px] sm:max-w-[200px]">
              {workspace?.name || "Workspace"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
          </button>

          {workspaceMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setWorkspaceMenuOpen(false)}
              />
              <div className="absolute left-0 mt-2 w-64 rounded-card border border-border bg-surface p-2 shadow-floating z-50 animate-in fade-in-0 zoom-in-95 text-body-xs">
                <div className="p-2 border-b border-border mb-1">
                  <span className="text-[10px] font-mono uppercase text-ink-muted block font-semibold">
                    Current Active Workspace
                  </span>
                  <span className="font-display font-bold text-ink truncate block mt-0.5">
                    {workspace?.name || "Workspace"}
                  </span>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    {workspace?.industry || "Packaging"} Hub
                  </span>
                </div>

                <div className="space-y-1">
                  <Link
                    href="/onboarding"
                    onClick={() => setWorkspaceMenuOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-xl text-ink hover:bg-surface-muted"
                  >
                    <Plus className="w-4 h-4 text-brand-lime" />
                    <span>Create New Workspace</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setWorkspaceMenuOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-xl text-ink hover:bg-surface-muted"
                  >
                    <Building2 className="w-4 h-4 text-ink-muted" />
                    <span>Workspace Settings</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        <span className="text-border hidden sm:inline">|</span>

        {/* Top Contextual Page Breadcrumb */}
        <span className="font-display text-body-sm font-bold text-ink hidden sm:inline">
          {title}
        </span>
      </div>

      {/* Center: Command Palette Trigger */}
      <button
        type="button"
        onClick={onOpenCommandPalette}
        className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-surface-muted/60 border border-border text-body-xs text-ink-muted hover:text-ink hover:border-[#D5D2C8] transition-all max-w-sm w-full mx-4 shadow-sm"
      >
        <Search className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
        <span className="truncate flex-1 text-left">Search orders, specs, customers...</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded bg-surface px-1.5 py-0.5 text-[10px] font-mono border border-border text-ink-muted font-bold">
          ⌘K
        </kbd>
      </button>

      {/* Right: Quick Actions & Profile Menu */}
      <div className="flex items-center gap-2.5">
        {/* Quick New Import */}
        <Link href="/inbox">
          <Button
            variant="default"
            size="sm"
            className="rounded-full h-8 px-3.5 text-body-xs font-semibold gap-1.5 shadow-tactile"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Chat</span>
          </Button>
        </Link>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-surface border border-border shadow-tactile hover:bg-surface-muted transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-lime text-ink font-bold text-xs shadow-xs border border-brand-limeHover">
              {user?.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <span className="text-body-xs font-semibold text-ink hidden sm:inline max-w-[100px] truncate">
              {user?.name || "User"}
            </span>
            <ChevronDown className="w-3 h-3 text-ink-muted" />
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-card border border-border bg-surface p-2 shadow-floating z-50 text-body-xs animate-in fade-in-0 zoom-in-95">
                <div className="p-2.5 border-b border-border mb-1">
                  <span className="font-bold text-ink truncate block">
                    {user?.name || "User"}
                  </span>
                  <span className="text-[11px] font-mono text-ink-muted truncate block">
                    {user?.email || ""}
                  </span>
                  <span className="mt-1.5 inline-block text-[10px] font-mono font-bold uppercase rounded-full px-2 py-0.2 bg-brand-lime/20 text-ink border border-brand-lime/40">
                    {workspace?.role || "MEMBER"}
                  </span>
                </div>

                <div className="space-y-1">
                  <Link
                    href="/inbox"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-xl text-ink hover:bg-surface-muted"
                  >
                    <span>Customer Inbox</span>
                  </Link>

                  <Link
                    href="/orders"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-xl text-ink hover:bg-surface-muted"
                  >
                    <span>Production Orders</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-xl text-ink hover:bg-surface-muted"
                  >
                    <span>Settings</span>
                  </Link>
                </div>

                <div className="pt-1 mt-1 border-t border-border">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-[#D64545] hover:bg-[#FDF2F2] transition text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
