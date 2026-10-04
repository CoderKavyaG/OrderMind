"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Radio, CheckCircle2, Clock, ArrowRight, MessageSquare, Instagram, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChannelItem } from "@/server/services/channel.service";

export default function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/channels")
      .then((res) => res.json())
      .then((data) => {
        if (data.channels) setChannels(data.channels);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="Channels & Ingestion">
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 bg-canvas min-h-screen">
        {/* Header */}
        <div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted block font-semibold">
            Unified ChannelAdapter Pipeline
          </span>
          <h1 className="text-display-sm font-display font-extrabold text-ink tracking-tight mt-0.5">
            Communication Channels
          </h1>
          <p className="text-body-xs text-ink-muted mt-1 max-w-xl">
            Ingestion channels feeding customer conversations into the unified <code>NormalizedMessage</code> model. Zero channel-specific order logic.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-body-xs text-ink-muted flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-ink border-t-brand-lime rounded-full animate-spin"></div>
            <span className="font-mono text-[11px]">Loading channel adapters...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {channels.map((chan) => {
              const isActive = chan.status === "active";

              return (
                <div
                  key={chan.id}
                  className={`p-6 rounded-card border bg-surface flex flex-col justify-between transition-all duration-200 shadow-soft hover:shadow-tactile ${
                    isActive ? "border-[#D0CDC2]" : "border-border opacity-90"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-brand-lime text-ink border border-brand-limeHover flex items-center justify-center font-bold shadow-xs">
                        {chan.type === "manual" ? (
                          <FileText className="w-5 h-5" />
                        ) : chan.type === "whatsapp" ? (
                          <MessageSquare className="w-5 h-5 text-ink" />
                        ) : (
                          <Instagram className="w-5 h-5 text-ink" />
                        )}
                      </div>

                      {isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#1F8A4C] bg-[#E8F6EE] px-2.5 py-0.5 rounded-full border border-[#BDE6CE]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#B7791F] bg-[#FEF7EC] px-2.5 py-0.5 rounded-full border border-[#FCE0B8]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Adapter Ready</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-body-md text-ink">{chan.name}</h3>
                      <p className="text-body-xs text-ink-muted mt-1 leading-relaxed font-sans">
                        {chan.description}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-muted/60 text-[11px] font-mono text-ink-muted leading-normal border border-border/80">
                      {chan.details}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border mt-5 flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold text-ink-subtle uppercase">
                      Adapter: {chan.type}
                    </span>
                    {isActive ? (
                      <Link href="/inbox">
                        <Button
                          variant="default"
                          size="sm"
                          className="rounded-full shadow-tactile h-7 px-3 text-[11px] font-semibold gap-1"
                        >
                          <span>Open Inbox</span>
                          <ArrowRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-[11px] font-mono text-ink-subtle">Plug &amp; Play</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-5 rounded-card bg-surface border border-border text-body-xs space-y-2 shadow-soft">
          <div className="flex items-center gap-2 text-ink font-display font-bold">
            <ShieldCheck className="w-4 h-4 text-brand-lime" />
            <span>Channel Architecture Isolation Guarantee</span>
          </div>
          <p className="text-ink-muted text-body-xs leading-relaxed font-sans">
            Per the OrderMind standing rules, all messaging sources (manual exports, chat webhooks, Instagram DMs) normalize into a single internal <code>NormalizedMessage</code> model. The downstream Gemma extraction stages, event timeline, conflict detectors, and state reducers have zero channel-specific business logic.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
