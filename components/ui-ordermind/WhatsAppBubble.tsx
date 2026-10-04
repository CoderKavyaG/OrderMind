"use client";

import * as React from "react";
import { Check, CheckCheck, FileText, Image as ImageIcon, Paperclip, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AttachmentItem {
  id: string;
  name: string;
  type: "image" | "pdf" | "audio" | "file";
  size?: string;
  url?: string;
}

export interface WhatsAppBubbleProps {
  id?: string;
  senderName: string;
  senderRole?: "customer" | "business";
  content: string;
  timestamp: string;
  readStatus?: "sent" | "delivered" | "read";
  attachments?: AttachmentItem[];
  highlightQuote?: string;
  onSelectQuote?: (quote: string) => void;
  className?: string;
}

export function WhatsAppBubble({
  senderName,
  senderRole = "customer",
  content,
  timestamp,
  readStatus = "read",
  attachments = [],
  highlightQuote,
  onSelectQuote,
  className,
}: WhatsAppBubbleProps) {
  const isCustomer = senderRole === "customer";

  return (
    <div
      className={cn(
        "flex flex-col max-w-[85%] sm:max-w-[70%] select-none transition-all duration-200",
        isCustomer ? "mr-auto items-start" : "ml-auto items-end",
        className
      )}
    >
      {/* Sender Header */}
      <div className="flex items-center gap-1.5 px-2 mb-1 text-[11px] font-medium text-ink-muted">
        <span className="font-semibold text-ink">{senderName}</span>
        <span className="text-[10px] opacity-75">
          ({isCustomer ? "Customer" : "Operator"})
        </span>
      </div>

      {/* Bubble Container */}
      <div
        className={cn(
          "relative rounded-2xl p-3.5 border shadow-sm transition-all duration-200",
          isCustomer
            ? "bg-white text-ink border-[#E4E0D5] rounded-tl-xs hover:border-[#D5D0C5]"
            : "bg-[#D9FDD3] text-ink border-[#BDEBB4] rounded-tr-xs hover:border-[#ACDF9F]"
        )}
      >
        {/* Message Content with Quote Highlight if applicable */}
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap font-sans text-ink">
          {highlightQuote && content.includes(highlightQuote) ? (
            <>
              {content.split(highlightQuote)[0]}
              <mark
                onClick={() => onSelectQuote?.(highlightQuote)}
                className="bg-brand-lime/40 text-ink font-semibold px-1 py-0.5 rounded cursor-pointer underline decoration-brand-limeHover decoration-2"
                title="Extracted Claim Evidence"
              >
                {highlightQuote}
              </mark>
              {content.split(highlightQuote).slice(1).join(highlightQuote)}
            </>
          ) : (
            content
          )}
        </p>

        {/* Attachments Section */}
        {attachments.length > 0 && (
          <div className="mt-2.5 space-y-2 pt-2 border-t border-black/5">
            {attachments.map((att) => {
              if (att.type === "image" && att.url) {
                return (
                  <div key={att.id} className="rounded-xl overflow-hidden border border-[#E0DCD2] bg-[#FAF8F5]">
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group relative cursor-pointer"
                      title="Click to open image full-size"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={att.url}
                        alt={att.name}
                        className="w-full max-h-56 object-cover transition group-hover:opacity-95"
                        loading="lazy"
                      />
                    </a>
                    <div className="p-1.5 px-2 text-[10px] flex items-center justify-between bg-white text-ink">
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate max-w-[180px] font-medium hover:underline"
                        title="Open in new tab"
                      >
                        {att.name}
                      </a>
                      <a
                        href={att.url}
                        download={att.name}
                        className="p-1 text-ink-muted hover:text-ink transition"
                        title="Download"
                      >
                        <Download className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              }

              return (
                <a
                  key={att.id}
                  href={att.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-body-xs font-medium border border-[#E0DCD2] text-ink shadow-xs hover:bg-[#FAF8F5] transition cursor-pointer"
                  title="Click to open attachment"
                >
                  {att.type === "pdf" ? (
                    <FileText className="w-3.5 h-3.5 text-[#D64545]" />
                  ) : (
                    <Paperclip className="w-3.5 h-3.5 text-ink-subtle" />
                  )}
                  <span className="truncate max-w-[140px]">{att.name}</span>
                  {att.size && (
                    <span className="text-[10px] text-ink-subtle font-mono">{att.size}</span>
                  )}
                </a>
              );
            })}
          </div>
        )}

        {/* Bottom Metadata: Timestamp + Read Receipts */}
        <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[10px] font-mono text-ink-subtle select-none">
          <span>{timestamp}</span>

          {!isCustomer && (
            <span title={`Status: ${readStatus}`}>
              {readStatus === "read" ? (
                <CheckCheck className="w-3.5 h-3.5 text-[#2B7BE4]" />
              ) : readStatus === "delivered" ? (
                <CheckCheck className="w-3.5 h-3.5 text-ink-subtle" />
              ) : (
                <Check className="w-3.5 h-3.5 text-ink-subtle" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
