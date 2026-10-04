"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, X } from "lucide-react";

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="fixed top-4 inset-x-0 z-50 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 py-2.5 rounded-full bg-surface/90 backdrop-blur-md border border-border shadow-floating transition-all duration-200">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-lime text-ink shadow-tactile font-display font-extrabold text-base transition-transform group-hover:scale-105 border border-[#BDE82B]">
              OM
            </div>
            <span className="font-display text-heading-md font-bold tracking-tight text-ink">
              OrderMind
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-body-sm font-medium text-ink-muted">
            <a href="#how-it-works" className="hover:text-ink transition-colors">
              How it works
            </a>
            <a href="#features" className="hover:text-ink transition-colors">
              Features
            </a>
            <a href="#packaging-types" className="hover:text-ink transition-colors">
              Substrates & Formats
            </a>
            <a href="#open-source" className="hover:text-ink transition-colors">
              Open-source
            </a>
            <Link href="/story" className="hover:text-ink transition-colors">
              Our story
            </Link>
          </nav>

          {/* Right CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="text-body-sm font-semibold text-ink-muted hover:text-ink px-3 py-1.5 transition-colors"
            >
              Sign in
            </Link>
            <Link href="/signup">
              <Button
                variant="default"
                size="sm"
                className="rounded-full shadow-tactile font-semibold gap-1.5 bg-brand-lime text-slate-950 hover:bg-brand-limeHover border border-[#BDE82B]"
              >
                Get started
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:hidden">
            <Link href="/signup">
              <Button
                variant="default"
                size="sm"
                className="h-8 px-3 rounded-full text-body-xs font-semibold bg-brand-lime text-slate-950 hover:bg-brand-limeHover"
              >
                Get started
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-surface-muted"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="mt-2 p-4 rounded-card-lg bg-surface border border-border shadow-floating flex flex-col gap-3 sm:hidden animate-in fade-in-0 zoom-in-95">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-body-sm font-medium text-ink hover:bg-surface-muted"
            >
              How it works
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-body-sm font-medium text-ink hover:bg-surface-muted"
            >
              Features
            </a>
            <a
              href="#packaging-types"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-body-sm font-medium text-ink hover:bg-surface-muted"
            >
              Substrates & Formats
            </a>
            <a
              href="#open-source"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-body-sm font-medium text-ink hover:bg-surface-muted"
            >
              Open-source
            </a>
            <Link
              href="/story"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-body-sm font-medium text-ink hover:bg-surface-muted"
            >
              Our story
            </Link>
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <Link
                href="/login"
                className="text-body-sm font-medium text-ink-muted hover:text-ink"
              >
                Sign in
              </Link>
              <Link href="/signup">
                <Button variant="default" size="sm" className="rounded-full bg-brand-lime text-slate-950 font-bold">
                  Get started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
