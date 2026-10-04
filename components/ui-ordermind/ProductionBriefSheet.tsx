"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusChip } from "./StatusChip";
import { Printer, Copy, Check, FileCheck2, ShieldCheck, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ProductionBriefData {
  orderNumber: string;
  customerName: string;
  version: number;
  confirmedAt: string;
  fields: {
    productType?: string;
    quantity?: string | number;
    dimensions?: string;
    material?: string;
    finish?: string;
    printing?: string;
    accessories?: string;
    deadline?: string;
    specialInstructions?: string;
  };
  attachments?: Array<{ name: string; type: string; size?: string }>;
}

export interface ProductionBriefSheetProps {
  data: ProductionBriefData;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProductionBriefSheet({
  data,
  trigger,
  open,
  onOpenChange,
}: ProductionBriefSheetProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    const text = `
ORDERMIND PRODUCTION BRIEF
Order: ${data.orderNumber}
Customer: ${data.customerName}
Version: v${data.version} (${data.confirmedAt})

SPECIFICATIONS:
• Product: ${data.fields.productType || "N/A"}
• Quantity: ${data.fields.quantity || "N/A"}
• Dimensions: ${data.fields.dimensions || "N/A"}
• Material: ${data.fields.material || "N/A"}
• Finish: ${data.fields.finish || "N/A"}
• Printing: ${data.fields.printing || "N/A"}
• Accessories: ${data.fields.accessories || "N/A"}
• Deadline: ${data.fields.deadline || "N/A"}

Special Instructions:
${data.fields.specialInstructions || "Standard die cut and inspection required."}
`.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Production brief copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}

      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto bg-surface p-6 sm:p-8"
      >
        <SheetHeader className="border-b border-border pb-4 mb-6">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-lime text-ink shadow-sm">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <SheetTitle className="font-display text-heading-md font-bold text-ink">
                  Production Brief
                </SheetTitle>
                <SheetDescription className="text-body-xs font-mono text-ink-muted">
                  Order #{data.orderNumber} • {data.customerName}
                </SheetDescription>
              </div>
            </div>

            <StatusChip status="CONFIRMED" size="sm" />
          </div>
        </SheetHeader>

        {/* Sealed Badge & Guarantee */}
        <div className="mb-6 rounded-card border border-[#BDE6CE] bg-[#E8F6EE] p-4 flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-[#1F8A4C] shrink-0" />
          <div className="flex flex-col">
            <span className="text-body-xs font-bold uppercase tracking-wider text-[#1F8A4C]">
              Confirmed & Sealed for Manufacturing
            </span>
            <span className="text-[12px] text-ink-muted mt-0.5">
              Generated deterministically from validated customer claims. Zero unconfirmed fields.
            </span>
          </div>
        </div>

        {/* Specs Matrix */}
        <div className="space-y-4">
          <h4 className="text-body-xs font-mono font-bold uppercase tracking-wider text-ink-muted">
            Technical Specifications
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Product Type", value: data.fields.productType },
              { label: "Quantity", value: data.fields.quantity },
              { label: "Dimensions (L x W x H)", value: data.fields.dimensions },
              { label: "Material & Board", value: data.fields.material },
              { label: "Surface Finish", value: data.fields.finish },
              { label: "Color / Printing", value: data.fields.printing },
              { label: "Accessories", value: data.fields.accessories },
              { label: "Delivery Deadline", value: data.fields.deadline },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-card border border-border bg-surface-elevated p-3 shadow-sm"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted block">
                  {item.label}
                </span>
                <span className="text-body-sm font-semibold text-ink font-mono mt-1 block">
                  {item.value || "—"}
                </span>
              </div>
            ))}
          </div>

          {/* Special Instructions */}
          {data.fields.specialInstructions && (
            <div className="rounded-card border border-border bg-surface-elevated p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted block mb-1">
                Special Instructions
              </span>
              <p className="text-body-sm text-ink leading-relaxed font-sans">
                {data.fields.specialInstructions}
              </p>
            </div>
          )}

          {/* Attachments & Dieline Cut CAD Files */}
          {data.attachments && data.attachments.length > 0 && (
            <div className="rounded-card border border-border bg-surface-muted/50 p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted block mb-2">
                Production Files & Dielines
              </span>
              <div className="space-y-2">
                {data.attachments.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-xl bg-surface border border-border text-body-xs"
                  >
                    <span className="font-mono text-ink font-medium truncate max-w-[200px]">
                      {file.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px] gap-1 text-ink"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <SheetFooter className="mt-8 pt-4 border-t border-border flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-full gap-2 border-border"
            onClick={handleCopy}
          >
            {copied ? <Check className="w-4 h-4 text-[#1F8A4C]" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied Brief" : "Copy as Text"}
          </Button>

          <Button
            variant="default"
            className="flex-1 rounded-full gap-2 font-semibold"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4" />
            Print Brief
          </Button>
        </SheetFooter>

        <div className="mt-4 text-center">
          <span className="text-[11px] font-mono text-ink-subtle">
            Sealed Snapshot Version {data.version} • {data.confirmedAt}
          </span>
        </div>
      </SheetContent>
    </Sheet>
  );
}
