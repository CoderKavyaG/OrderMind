"use client";

import * as React from "react";
import { Check, Loader2, Sparkles, MessageSquare, Database, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PipelineStage {
  id: string;
  name: string;
  description: string;
  status: "completed" | "active" | "pending";
}

export interface PipelineStripProps {
  stages?: PipelineStage[];
  currentStageId?: string;
  onStageClick?: (id: string) => void;
  className?: string;
}

const defaultStages: PipelineStage[] = [
  {
    id: "ingestion",
    name: "1. Ingestion",
    description: "Multimodal Chat Normalization",
    status: "completed",
  },
  {
    id: "extraction",
    name: "2. Gemma AI",
    description: "Evidence-Backed Claims",
    status: "completed",
  },
  {
    id: "normalization",
    name: "3. Reference Engine",
    description: "Delta & History Resolution",
    status: "active",
  },
  {
    id: "reducer",
    name: "4. State Engine",
    description: "Pure Event Reducer",
    status: "pending",
  },
  {
    id: "brief",
    name: "5. Production Brief",
    description: "Confirmed CAD & Specs",
    status: "pending",
  },
];

export function PipelineStrip({
  stages = defaultStages,
  currentStageId,
  onStageClick,
  className,
}: PipelineStripProps) {
  const getIcon = (stage: PipelineStage, index: number) => {
    if (stage.status === "completed") {
      return <Check className="w-3.5 h-3.5 stroke-[3] text-ink" />;
    }
    if (stage.status === "active") {
      return <Loader2 className="w-3.5 h-3.5 animate-spin text-ink" />;
    }
    return <span className="font-mono text-xs text-ink-subtle">{index + 1}</span>;
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 overflow-x-auto no-scrollbar p-2 bg-surface-muted/60 rounded-card-lg border border-border select-none",
        className
      )}
    >
      {stages.map((stage, idx) => {
        const isActive = stage.status === "active" || stage.id === currentStageId;
        const isCompleted = stage.status === "completed";

        return (
          <React.Fragment key={stage.id}>
            <button
              type="button"
              onClick={() => onStageClick?.(stage.id)}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-full px-3.5 py-2 text-left transition-all duration-200 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-brand-lime",
                isActive
                  ? "bg-brand-lime text-ink shadow-tactile border border-brand-limeHover"
                  : isCompleted
                  ? "bg-surface-elevated text-ink border border-border hover:bg-surface"
                  : "bg-transparent text-ink-muted hover:text-ink opacity-70"
              )}
            >
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full shrink-0 border transition-transform duration-200 group-hover:scale-105",
                  isActive
                    ? "bg-ink text-brand-lime border-ink"
                    : isCompleted
                    ? "bg-[#E8F6EE] text-[#1F8A4C] border-[#BDE6CE]"
                    : "bg-surface-muted text-ink-subtle border-border"
                )}
              >
                {getIcon(stage, idx)}
              </div>

              <div className="flex flex-col min-w-0 pr-1">
                <span className="font-display text-body-xs font-bold leading-none tracking-tight">
                  {stage.name}
                </span>
                <span className="text-[10px] text-ink-muted truncate font-sans mt-0.5 max-w-[130px]">
                  {stage.description}
                </span>
              </div>
            </button>

            {idx < stages.length - 1 && (
              <div className="h-0.5 w-3 bg-border shrink-0 opacity-80" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
