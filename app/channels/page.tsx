"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageSquare,
  Instagram,
  FileText,
  ShieldCheck,
  ExternalLink,
  Info,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChannelItem } from "@/server/services/channel.service";

export default function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMetaGuide, setShowMetaGuide] = useState(false);

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

          <button
            type="button"
            onClick={() => setShowMetaGuide(!showMetaGuide)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface text-xs font-semibold text-ink hover:bg-surface-muted transition shadow-soft self-start"
          >
            <Info className="w-3.5 h-3.5 text-blue-500" />
            <span>{showMetaGuide ? "Hide Meta Cloud API Application Guide" : "Where to Apply for WhatsApp Cloud API"}</span>
          </button>
        </div>

        {/* Meta Application Guide Modal/Banner */}
        {showMetaGuide && (
          <div className="p-5 md:p-6 rounded-card bg-slate-900 text-slate-100 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-500/20 text-green-400 rounded-lg">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-sm text-white">
                  Official Steps: Apply for Meta WhatsApp Business Cloud API Access
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                Zero Cloud Markup (Official Meta API)
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              To connect your real WhatsApp Business phone number directly to OrderMind via Webhooks, your organization must apply directly with Meta. Follow these official registration links:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Step 1</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <h4 className="text-xs font-bold text-white">Meta Developer Portal</h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Log into Meta for Developers, create an app, and select <strong>Other &gt; Business</strong>.
                </p>
                <a
                  href="https://developers.facebook.com/apps/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 pt-1"
                >
                  developers.facebook.com &rarr;
                </a>
              </div>

              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Step 2</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <h4 className="text-xs font-bold text-white">Business Verification</h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  In Meta Business Manager, upload company GST/Tax ID &amp; official utility bill to verify your packaging business entity.
                </p>
                <a
                  href="https://business.facebook.com/settings/security"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 pt-1"
                >
                  business.facebook.com &rarr;
                </a>
              </div>

              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Step 3</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <h4 className="text-xs font-bold text-white">WhatsApp Cloud API</h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Add WhatsApp to your app, register your dedicated phone number, and generate a permanent System User Token.
                </p>
                <a
                  href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 pt-1"
                >
                  Cloud API Docs &rarr;
                </a>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-body-xs text-ink-muted flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-ink border-t-brand-lime rounded-full animate-spin"></div>
            <span className="font-mono text-[11px]">Loading channel adapters...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {channels.map((chan) => {
              const isActive = chan.status === "active";
              const isMetaChannel = chan.type === "whatsapp" || chan.type === "instagram";

              return (
                <div
                  key={chan.id}
                  className={`p-6 rounded-card border bg-surface flex flex-col justify-between transition-all duration-200 shadow-soft hover:shadow-tactile ${
                    isActive ? "border-[#D0CDC2]" : "border-border opacity-95"
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
                          <span>Active (Live)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Partner Approval Pending</span>
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
                          className="rounded-full shadow-tactile h-7 px-3 text-[11px] font-semibold gap-1 bg-brand-lime hover:bg-brand-limeHover text-ink"
                        >
                          <span>Open Inbox</span>
                          <ArrowRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        disabled
                        variant="secondary"
                        size="sm"
                        className="rounded-full opacity-60 cursor-not-allowed h-7 px-3 text-[10px] font-semibold gap-1 border border-border bg-surface-muted text-ink-muted"
                        title="Meta Cloud API Tech Partner Review in progress. Currently non-clickable."
                      >
                        <Lock className="w-3 h-3" />
                        <span>Coming Soon</span>
                      </Button>
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
