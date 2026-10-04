"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { StatusChip } from "@/components/ui-ordermind/StatusChip";
import { Button } from "@/components/ui/button";
import {
  Printer,
  Copy,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Calendar,
  PackageCheck,
  Check,
  ShieldCheck,
  Lock,
  FileCheck,
  Building2,
  File,
} from "lucide-react";
import { toast } from "sonner";
import type { ProductionBriefWithMeta } from "@/server/services/productionBrief.service";
import type { OrderWithDetails } from "@/server/services/order.service";

export default function ProductionBriefPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [brief, setBrief] = useState<ProductionBriefWithMeta | null>(null);
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchBriefAndOrder = useCallback(async () => {
    try {
      setLoading(true);
      const [ordRes, briefRes] = await Promise.all([
        fetch(`/api/orders/${orderId}`),
        fetch(`/api/orders/${orderId}/brief`),
      ]);

      const ordData = await ordRes.json();
      const briefData = await briefRes.json();

      if (ordRes.ok) {
        setOrder(ordData.order);
        if (ordData.order?.status === "CONFIRMED" && !briefData?.brief) {
          try {
            const genRes = await fetch(`/api/orders/${orderId}/brief`, { method: "POST" });
            const genData = await genRes.json();
            if (genRes.ok && genData.brief) {
              setBrief(genData.brief);
            }
          } catch {
            // User can still trigger manually
          }
        }
      }
      if (briefRes.ok && briefData.brief) {
        setBrief(briefData.brief);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load brief");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) fetchBriefAndOrder();
  }, [orderId, fetchBriefAndOrder]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/brief`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate brief");
      }
      setBrief(data.brief);
      toast.success("Generated production manufacturing brief!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to compile brief";
      setError(msg);
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    if (!brief) return;
    const c = brief.content;
    const text = `=========================================
ORDERMIND PACKAGING PRODUCTION BRIEF
Order: ${c.orderNumber}
Client: ${c.customerName}
Delivery Deadline: ${c.deadline}
=========================================
Product Style: ${c.productType}
Quantity: ${c.quantity}
Dimensions: ${c.dimensions}
Board Material: ${c.material}
Printing: ${c.printing}
Surface Finish: ${c.finish}
Accessories: ${c.accessories || "None"}
-----------------------------------------
Special Instructions:
${c.specialInstructions || "Standard packaging die cut and quality inspection required."}
-----------------------------------------
${c.footer}
=========================================`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied brief to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <AppShell title="Production Brief">
        <div className="flex h-screen items-center justify-center bg-canvas">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-ink border-t-brand-lime rounded-full animate-spin"></div>
            <span className="font-mono text-xs text-ink-muted">Loading sealed job sheet...</span>
          </div>
        </div>
      </AppShell>
    );
  }

  const isConfirmed = order?.status === "CONFIRMED";

  return (
    <AppShell title={`Production Brief - ${order?.orderNumber || "Order"}`}>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 bg-canvas min-h-screen">
        {/* Navigation & Controls Bar (hidden during print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden border-b border-border pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/orders/${orderId}`}
              className="inline-flex items-center gap-1.5 text-body-xs text-ink-muted hover:text-ink transition font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Order Workspace</span>
            </Link>
            <span className="text-border">•</span>
            <Link
              href="/orders"
              className="inline-flex items-center gap-1 text-body-xs text-ink-muted hover:text-ink transition font-medium"
            >
              <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>All Orders Matrix</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {brief && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyText}
                  className="rounded-full bg-surface border-border hover:bg-surface-muted text-body-xs font-semibold gap-1.5 shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#1F8A4C]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handlePrint}
                  className="rounded-full text-body-xs font-semibold gap-1.5 shadow-tactile"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Job Sheet</span>
                </Button>
              </>
            )}

            {(!brief || brief.isStale) && isConfirmed && (
              <Button
                variant="default"
                size="sm"
                onClick={handleGenerate}
                disabled={generating}
                className="rounded-full shadow-tactile text-body-xs font-semibold gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
                <span>{brief ? "Regenerate Brief" : "Generate Production Brief"}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Unconfirmed Block State */}
        {!isConfirmed && (
          <div className="p-6 rounded-card border border-[#FCE0B8] bg-[#FEF7EC] space-y-4">
            <div className="flex items-center gap-2 text-[#B7791F] font-bold text-body-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>Production Brief Generation Locked</span>
            </div>
            <p className="text-body-xs text-ink leading-relaxed font-sans">
              Order status is currently <strong>{order?.status || "NEEDS_REVIEW"}</strong>. Per strict manufacturing rules, production briefs cannot be generated until all specifications are 100% CONFIRMED by the operator with zero conflicting or unverified items.
            </p>
            <div className="pt-1 flex items-center gap-2.5 flex-wrap">
              <Link href={`/orders/${orderId}`}>
                <Button variant="default" size="sm" className="rounded-full text-body-xs font-semibold gap-1.5 shadow-tactile bg-brand-lime text-slate-950 hover:bg-brand-limeHover border border-[#BDE82B]">
                  <span>Return to Order #{order?.orderNumber || orderId} to Verify Specs</span>
                  <ArrowLeft className="w-3 h-3 rotate-180 stroke-[2.5]" />
                </Button>
              </Link>
              <Link href="/orders">
                <Button variant="outline" size="sm" className="rounded-full text-body-xs font-semibold gap-1 bg-white border-border">
                  <PackageCheck className="w-3.5 h-3.5 text-slate-600" />
                  <span>Go to All Orders Matrix</span>
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Stale Warning Banner */}
        {brief?.isStale && (
          <div className="p-4 rounded-card border border-[#FCE0B8] bg-[#FEF7EC] text-body-xs flex items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2 text-ink">
              <AlertTriangle className="w-4 h-4 text-[#B7791F] shrink-0" />
              <span>
                Order specifications were modified after this brief was generated. Click Regenerate to update.
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              className="rounded-full bg-white text-body-xs shrink-0"
            >
              Update Now
            </Button>
          </div>
        )}

        {/* Empty State before first generation */}
        {isConfirmed && !brief && (
          <div className="p-12 text-center rounded-card-lg border border-dashed border-border bg-surface p-8 space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-lime/15 border border-brand-lime/30 flex items-center justify-center text-ink shadow-sm mx-auto">
              <FileCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-body-md text-ink">
                Ready for Production Brief
              </h3>
              <p className="text-body-xs text-ink-muted max-w-sm mx-auto leading-relaxed">
                All packaging specifications have been confirmed and locked. Click below to compile the official manufacturing job sheet.
              </p>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-full shadow-tactile text-body-xs font-semibold"
            >
              {generating ? "Compiling..." : "Generate Production Brief"}
            </Button>
          </div>
        )}

        {/* Printable Production Brief Sheet */}
        {brief && (
          <div className="border border-border rounded-card-lg bg-surface p-6 md:p-10 shadow-soft space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 print:bg-white print:text-black">
            {/* Brief Header */}
            <div className="border-b-2 border-brand-lime pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="text-[10px] font-mono tracking-widest uppercase text-ink-muted font-bold flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-brand-lime" />
                  <span>OrderMind Packaging Engineering System</span>
                </div>
                <h1 className="font-display text-display-sm font-extrabold tracking-tight text-ink print:text-black uppercase mt-1">
                  Production Manufacturing Brief
                </h1>
                <div className="text-body-xs text-ink-muted print:text-gray-600 pt-0.5">
                  Job Sheet &amp; Die-Cutting Specifications
                </div>
              </div>

              <div className="text-right space-y-1 font-mono text-body-xs">
                <div className="text-base font-bold text-ink print:text-black">
                  {brief.content.orderNumber}
                </div>
                <div className="text-[11px] text-ink-muted print:text-gray-600">
                  Date: {new Date(brief.generatedAt).toLocaleDateString()}
                </div>
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1F8A4C] print:text-emerald-700 bg-[#E8F6EE] px-2 py-0.5 rounded-full border border-[#BDE6CE]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Version v{brief.versionNumber} Locked</span>
                </div>
              </div>
            </div>

            {/* Client & Deadline Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-surface-muted/60 border border-border print:border-gray-300 print:bg-gray-50 text-body-xs">
              <div>
                <div className="text-[10px] font-mono uppercase font-bold text-ink-muted print:text-gray-500">
                  Client / Brand
                </div>
                <div className="font-display font-bold text-ink print:text-black text-body-sm pt-0.5">
                  {brief.content.customerName}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase font-bold text-ink-muted print:text-gray-500">
                  Target Delivery
                </div>
                <div className="font-mono font-bold text-ink print:text-black text-body-sm pt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-lime print:text-black" />
                  <span>{brief.content.deadline}</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase font-bold text-ink-muted print:text-gray-500">
                  Production Batch
                </div>
                <div className="font-mono font-bold text-ink print:text-black text-body-sm pt-0.5 flex items-center gap-1.5">
                  <PackageCheck className="w-3.5 h-3.5 text-[#1F8A4C] print:text-black" />
                  <span>{brief.content.quantity} Units</span>
                </div>
              </div>
            </div>

            {/* Core Specifications Table */}
            <div className="space-y-2">
              <h2 className="text-body-xs font-mono font-bold uppercase tracking-wider text-ink-muted print:text-gray-700">
                Technical Specifications
              </h2>
              <table className="w-full text-left text-body-xs border border-border print:border-gray-400 border-collapse rounded-xl overflow-hidden">
                <tbody>
                  <tr className="border-b border-border print:border-gray-300">
                    <td className="w-1/3 py-2.5 px-4 font-semibold text-ink-muted print:text-gray-700 bg-surface-muted/40 print:bg-gray-100 font-mono text-[11px]">
                      Structure / Style
                    </td>
                    <td className="py-2.5 px-4 font-bold text-ink print:text-black">
                      {brief.content.productType}
                    </td>
                  </tr>

                  <tr className="border-b border-border print:border-gray-300">
                    <td className="py-2.5 px-4 font-semibold text-ink-muted print:text-gray-700 bg-surface-muted/40 print:bg-gray-100 font-mono text-[11px]">
                      Dimensions (L x W x H)
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-ink print:text-black">
                      {brief.content.dimensions}
                    </td>
                  </tr>

                  <tr className="border-b border-border print:border-gray-300">
                    <td className="py-2.5 px-4 font-semibold text-ink-muted print:text-gray-700 bg-surface-muted/40 print:bg-gray-100 font-mono text-[11px]">
                      Board / Paper Material
                    </td>
                    <td className="py-2.5 px-4 font-medium text-ink print:text-black">
                      {brief.content.material}
                    </td>
                  </tr>

                  <tr className="border-b border-border print:border-gray-300">
                    <td className="py-2.5 px-4 font-semibold text-ink-muted print:text-gray-700 bg-surface-muted/40 print:bg-gray-100 font-mono text-[11px]">
                      Printing Specification
                    </td>
                    <td className="py-2.5 px-4 font-medium text-ink print:text-black">
                      {brief.content.printing}
                    </td>
                  </tr>

                  <tr className="border-b border-border print:border-gray-300">
                    <td className="py-2.5 px-4 font-semibold text-ink-muted print:text-gray-700 bg-surface-muted/40 print:bg-gray-100 font-mono text-[11px]">
                      Surface Finish &amp; Foiling
                    </td>
                    <td className="py-2.5 px-4 font-medium text-ink print:text-black">
                      {brief.content.finish}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-ink-muted print:text-gray-700 bg-surface-muted/40 print:bg-gray-100 font-mono text-[11px]">
                      Accessories &amp; Inserts
                    </td>
                    <td className="py-2.5 px-4 text-ink print:text-black">
                      {brief.content.accessories || "None"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Special Instructions */}
            <div className="space-y-1.5 pt-1">
              <h2 className="text-body-xs font-mono font-bold uppercase tracking-wider text-ink-muted print:text-gray-700">
                Production Notes &amp; Special Instructions
              </h2>
              <div className="p-4 rounded-xl border border-border print:border-gray-300 bg-surface-muted/30 print:bg-white text-body-xs leading-relaxed text-ink print:text-black font-sans">
                {brief.content.specialInstructions || "Standard die-cut testing and 100% QA check before palletizing."}
              </div>
            </div>

            {/* Reference Files & Artwork Thumbnails */}
            {((order?.attachments && order.attachments.length > 0) || (brief.content.referenceFiles && brief.content.referenceFiles.length > 0)) && (
              <div className="space-y-2 pt-1 print:break-inside-avoid">
                <h2 className="text-body-xs font-mono font-bold uppercase tracking-wider text-ink-muted print:text-gray-700">
                  Reference Files, Artwork &amp; Dielines
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(order?.attachments || []).map((att) => {
                    const isImg = att.contentType?.startsWith("image/") || att.filename.match(/\.(png|jpg|jpeg|webp)$/i);
                    return (
                      <a
                        key={att.id}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl border border-border print:border-gray-300 bg-surface-muted/20 hover:bg-surface-muted/40 transition flex flex-col items-center text-center gap-1.5 group"
                      >
                        {isImg ? (
                          <div className="w-full h-20 rounded-lg overflow-hidden border border-border print:border-gray-300 bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={att.url}
                              alt={att.filename}
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-20 rounded-lg border border-border print:border-gray-300 bg-white flex items-center justify-center text-ink-muted">
                            <File className="w-6 h-6 text-brand-lime" />
                          </div>
                        )}
                        <span className="text-[11px] font-medium text-ink print:text-black truncate w-full">
                          {att.filename}
                        </span>
                        <span className="text-[9px] text-ink-subtle print:text-gray-500 font-mono">
                          {(att.size / 1024).toFixed(0)} KB &bull; Open
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quality Sign-off Blocks */}
            <div className="pt-6 border-t border-border print:border-gray-400 grid grid-cols-3 gap-4 text-center text-body-xs">
              <div className="space-y-6">
                <div className="text-[10px] font-mono uppercase font-bold text-ink-muted print:text-gray-600">
                  Estimator / Lead
                </div>
                <div className="border-b border-border print:border-black w-3/4 mx-auto pb-1 text-[11px] font-mono font-semibold text-[#1F8A4C]">
                  Verified
                </div>
              </div>

              <div className="space-y-6">
                <div className="text-[10px] font-mono uppercase font-bold text-ink-muted print:text-gray-600">
                  Supervisor
                </div>
                <div className="border-b border-border print:border-black w-3/4 mx-auto pb-1 text-[11px] font-mono text-ink-subtle">
                  _________________
                </div>
              </div>

              <div className="space-y-6">
                <div className="text-[10px] font-mono uppercase font-bold text-ink-muted print:text-gray-600">
                  Quality Assurance
                </div>
                <div className="border-b border-border print:border-black w-3/4 mx-auto pb-1 text-[11px] font-mono text-ink-subtle">
                  _________________
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 text-center text-[10px] text-ink-subtle print:text-gray-500 font-mono">
              {brief.content.footer}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
