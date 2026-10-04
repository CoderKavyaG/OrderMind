"use client";

import * as React from "react";
import { StatusChip, OrderFieldStatus } from "./StatusChip";
import { EvidencePopover, EvidenceItem } from "./EvidencePopover";
import { Button } from "@/components/ui/button";
import { Check, Edit3, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FieldRowProps {
  label: string;
  value?: unknown;
  unit?: string;
  status: OrderFieldStatus;
  evidence?: EvidenceItem | null;
  onConfirm?: () => void;
  onEdit?: () => void;
  onJumpToMessage?: (messageId: string) => void;
  className?: string;
}

export function FieldRow({
  label,
  value,
  unit,
  status,
  evidence,
  onConfirm,
  onEdit,
  onJumpToMessage,
  className,
}: FieldRowProps) {
  const isMissing = status === "MISSING" || !value;

  return (
    <div
      className={cn(
        "group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-card border transition-all duration-200",
        status === "CONFLICTING"
          ? "border-status-conflicting/50 bg-[#FDF2F2]/60 hover:bg-[#FDF2F2]"
          : status === "INFERRED"
          ? "border-status-inferred/40 bg-[#FEF7EC]/50 hover:bg-[#FEF7EC]"
          : status === "CONFIRMED"
          ? "border-[#BDE6CE]/70 bg-surface hover:bg-[#F2EFE8]/80"
          : "border-dashed border-[#C8C5BA] bg-surface-muted/30 hover:bg-surface-muted/60",
        className
      )}
    >
      {/* Field Label & Value */}
      <div className="flex flex-col min-w-0 pr-2">
        <span className="text-body-xs font-semibold uppercase tracking-wider text-ink-muted">
          {label}
        </span>
        <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
          {isMissing ? (
            <span className="inline-flex items-center gap-1.5 text-body-sm font-medium text-ink-subtle italic">
              <AlertCircle className="w-3.5 h-3.5 text-status-missing" />
              Not specified yet
            </span>
          ) : (
            <span className="text-body-lg font-semibold text-ink break-words font-sans">
              {value !== null && value !== undefined ? String(value) : ""}{" "}
              {unit && <span className="text-body-xs font-normal text-ink-muted">{unit}</span>}
            </span>
          )}
        </div>
      </div>

      {/* Status, Evidence & Actions */}
      <div className="flex items-center gap-2.5 flex-wrap shrink-0 justify-start sm:justify-end">
        <StatusChip status={status} />

        {evidence && (
          <EvidencePopover
            evidence={evidence}
            onJumpToMessage={onJumpToMessage}
          />
        )}

        {/* Quick Operator Actions */}
        {status === "INFERRED" && onConfirm && (
          <Button
            size="sm"
            variant="default"
            onClick={onConfirm}
            className="h-8 px-3 rounded-full text-body-xs gap-1"
            title="Confirm inferred value"
          >
            <Check className="w-3 h-3 stroke-[3]" />
            Confirm
          </Button>
        )}

        {onEdit && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            className="h-8 w-8 p-0 rounded-full text-ink-muted hover:text-ink hover:bg-surface-muted"
            title="Edit value manually"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
