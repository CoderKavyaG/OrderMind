"use client";

import { useState, useEffect } from "react";
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  Mic,
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  AlertCircle,
  Eye,
  Paperclip,
} from "lucide-react";
import type { AttachmentMeta } from "@/server/db/schema";
import { parseWhatsAppExport, type ParsedChatMessage } from "@/server/services/chat-parser.service";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (conversationId: string) => void;
  initialText?: string;
  initialCustomerName?: string;
}

interface CustomerOption {
  id: string;
  name: string;
}

interface UploadedFileItem {
  id?: string;
  file: File;
  name: string;
  size: number;
  type: string;
  targetMessageIndex: number;
  uploadedAttachment?: AttachmentMeta;
  uploading?: boolean;
  error?: string;
}

export function ImportModal({
  isOpen,
  onClose,
  onImportComplete,
  initialText = "",
  initialCustomerName = "",
}: ImportModalProps) {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");

  const [chatTitle, setChatTitle] = useState("");
  const [rawText, setRawText] = useState(initialText);
  const [parsedMessages, setParsedMessages] = useState<ParsedChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<"input" | "attachments" | "preview">("input");

  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialText) setRawText(initialText);
      if (initialCustomerName) {
        setNewCustomerName(initialCustomerName);
      }
      fetch("/api/customers")
        .then((res) => res.json())
        .then((data) => {
          if (data.customers) {
            setCustomers(data.customers);
            if (initialCustomerName) {
              const matched = data.customers.find((c: CustomerOption) =>
                c.name.toLowerCase().includes(initialCustomerName.toLowerCase())
              );
              if (matched) {
                setSelectedCustomerId(matched.id);
                setIsNewCustomer(false);
              } else {
                setIsNewCustomer(true);
              }
            } else if (data.customers.length > 0 && !selectedCustomerId) {
              setSelectedCustomerId(data.customers[0].id);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, initialText, initialCustomerName, selectedCustomerId]);

  // Re-parse whenever rawText changes
  useEffect(() => {
    if (rawText.trim()) {
      const parsed = parseWhatsAppExport(rawText);
      setParsedMessages(parsed);
      if (!chatTitle && parsed.length > 0) {
        setChatTitle(`Order inquiry from ${parsed[0].senderName}`);
      }
    } else {
      setParsedMessages([]);
    }
  }, [rawText, chatTitle]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setRawText(content);
      };
      reader.readAsText(file);
    } else {
      setErrorMessage("Please select a plain text (.txt) WhatsApp export file.");
    }
  };

  const handleDropMedia = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newFiles: UploadedFileItem[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      if (f.size > 10 * 1024 * 1024) {
        setErrorMessage(`File "${f.name}" exceeds maximum allowed 10MB limit.`);
        continue;
      }
      newFiles.push({
        file: f,
        name: f.name,
        size: f.size,
        type: f.type,
        targetMessageIndex: parsedMessages.length > 0 ? parsedMessages.length - 1 : 0,
      });
    }

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleSaveImport = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      if (!isNewCustomer && !selectedCustomerId) {
        throw new Error("Please select an existing customer or create a new one");
      }
      if (isNewCustomer && !newCustomerName.trim()) {
        throw new Error("Please enter a customer name");
      }
      if (!rawText.trim() || parsedMessages.length === 0) {
        throw new Error("Please provide valid WhatsApp chat text to import");
      }

      // 1. Upload files first to GridFS
      const uploadedAttachments: Array<{
        attachment: AttachmentMeta;
        targetMessageIndex: number;
        targetFilename: string;
      }> = [];

      for (const item of files) {
        const formData = new FormData();
        formData.append("file", item.file);

        const uploadRes = await fetch("/api/attachments/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || `Failed to upload ${item.name}`);
        }

        uploadedAttachments.push({
          attachment: uploadData.attachment,
          targetMessageIndex: item.targetMessageIndex,
          targetFilename: item.name,
        });
      }

      // 2. Submit conversation import
      const importPayload = {
        customerId: isNewCustomer ? undefined : selectedCustomerId,
        newCustomerName: isNewCustomer ? newCustomerName.trim() : undefined,
        title: chatTitle.trim() || "Imported Chat",
        rawText,
        attachments: uploadedAttachments,
      };

      const res = await fetch("/api/inbox/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(importPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save conversation");
      }

      onImportComplete(data.conversationId);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs select-none">
      <div className="bg-card border border-border w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-card/60">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Import Conversation</h3>
            <p className="text-[11px] text-muted-foreground">
              WhatsApp .txt export &bull; Drag-and-drop media attachments &bull; Normalized ingestion
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-border text-xs bg-muted/20">
          <button
            onClick={() => setActiveTab("input")}
            className={`px-3 py-1.5 font-medium rounded-t-md transition border-b-2 -mb-[1px] ${
              activeTab === "input"
                ? "border-primary text-primary bg-card"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            1. Chat Text ({parsedMessages.length} msgs)
          </button>
          <button
            onClick={() => setActiveTab("attachments")}
            className={`px-3 py-1.5 font-medium rounded-t-md transition border-b-2 -mb-[1px] flex items-center gap-1.5 ${
              activeTab === "attachments"
                ? "border-primary text-primary bg-card"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>2. Media Attachments ({files.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            disabled={parsedMessages.length === 0}
            className={`px-3 py-1.5 font-medium rounded-t-md transition border-b-2 -mb-[1px] flex items-center gap-1.5 disabled:opacity-40 ${
              activeTab === "preview"
                ? "border-primary text-primary bg-card"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>3. Normalized Preview</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-md bg-destructive/15 border border-destructive/25 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Customer Selection Block */}
          <div className="p-3.5 rounded-lg border border-border bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-foreground">Customer</label>
                <button
                  type="button"
                  onClick={() => setIsNewCustomer(!isNewCustomer)}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  {isNewCustomer ? "Select existing customer" : "+ Add new customer"}
                </button>
              </div>

              {isNewCustomer ? (
                <input
                  type="text"
                  placeholder="Customer / Company Name"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md bg-input/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md bg-input/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  {customers.length === 0 && <option value="">No existing customers</option>}
                </select>
              )}
            </div>

            <div>
              <label className="font-medium text-foreground block mb-1">Conversation Title</label>
              <input
                type="text"
                placeholder="e.g. Rigid Box 500pcs Requirement"
                value={chatTitle}
                onChange={(e) => setChatTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-md bg-input/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* TAB 1: Raw Text Input */}
          {activeTab === "input" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Paste WhatsApp Export or Upload .txt</span>
                <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted hover:bg-muted/80 text-foreground cursor-pointer border border-border transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose .txt File</span>
                  <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {/* Meta & WhatsApp Cloud Compliance Note */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-[11px] leading-relaxed">
                  <span className="font-semibold text-foreground block">
                    WhatsApp Chat Export Ingestion (Ready for Meta API Integration)
                  </span>
                  <p className="text-muted-foreground">
                    Import WhatsApp conversational threads (.txt) exported from mobile or web. Formatted for commercial packaging intake, audio transcripts, and automated claim extraction via Gemma AI.
                  </p>
                </div>
              </div>

              <textarea
                rows={10}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Paste customer chat transcript here. Supported formats:\n[14/10/26, 2:30:15 PM] Customer Name: Hi, we need custom rigid boxes for our products.\n14/10/26, 2:32 pm - Customer Name: 500 units, 120x80x45 mm, 350 GSM SBS board with matte lamination.\n[2026-10-14 14:35:00] Business: Acknowledged, generating production proof.\n<attached: proof_drawing.pdf>`}
                className="w-full p-3 font-mono text-[11px] rounded-lg bg-input/20 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              />

              {parsedMessages.length > 0 && (
                <div className="flex items-center justify-between p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Successfully detected and parsed <strong>{parsedMessages.length}</strong> messages.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("attachments")}
                    className="font-medium hover:underline text-[11px]"
                  >
                    Proceed to Attachments &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Attachments */}
          {activeTab === "attachments" && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleDropMedia(e.dataTransfer.files);
                }}
                className={`p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center transition ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-muted-foreground/40 bg-muted/10"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="font-semibold text-foreground">Drag & drop production media</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Images (PNG, JPG), Audio Voice Notes (OGG, MP3, M4A), and Artwork PDFs (up to 10MB each).
                </div>
                <label className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs transition">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Select Files</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,audio/*,application/pdf"
                    onChange={(e) => handleDropMedia(e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Attached Files ({files.length})
                  </div>
                  <div className="divide-y divide-border border border-border rounded-lg bg-card overflow-hidden">
                    {files.map((item, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          {item.type.startsWith("image/") ? (
                            <ImageIcon className="w-4 h-4 text-sky-400 flex-shrink-0" />
                          ) : item.type.startsWith("audio/") ? (
                            <Mic className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          ) : (
                            <FileSpreadsheet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          )}
                          <div className="truncate">
                            <div className="font-medium text-foreground truncate">{item.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {(item.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <label className="text-[11px] text-muted-foreground">Attach to message:</label>
                          <select
                            value={item.targetMessageIndex}
                            onChange={(e) => {
                              const newIndex = parseInt(e.target.value, 10);
                              setFiles((prev) =>
                                prev.map((f, i) => (i === idx ? { ...f, targetMessageIndex: newIndex } : f))
                              );
                            }}
                            className="px-2 py-1 text-[11px] rounded bg-input/40 border border-border text-foreground"
                          >
                            {parsedMessages.map((msg, mIdx) => (
                              <option key={mIdx} value={mIdx}>
                                #{mIdx + 1} ({msg.senderName}): {msg.content.slice(0, 30)}...
                              </option>
                            ))}
                            {parsedMessages.length === 0 && <option value={0}>Message #1</option>}
                          </select>
                          <button
                            type="button"
                            onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-1 rounded text-muted-foreground hover:text-destructive transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Preview */}
          {activeTab === "preview" && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">
                Reviewing normalized conversation thread before storing in MongoDB:
              </div>
              <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/10 max-h-[360px] overflow-y-auto">
                {parsedMessages.map((msg, idx) => {
                  const matchingFiles = files.filter((f) => f.targetMessageIndex === idx);
                  const isCustomer = idx % 2 === 0;

                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isCustomer ? "items-start" : "items-end"}`}
                    >
                      <div className="text-[10px] text-muted-foreground mb-0.5 px-1">
                        <span className="font-semibold text-foreground/80">{msg.senderName}</span> &bull;{" "}
                        {msg.rawTimestamp}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                          isCustomer
                            ? "bg-card border border-border text-foreground"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>

                        {matchingFiles.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/30 space-y-1">
                            {matchingFiles.map((mf, mi) => (
                              <div
                                key={mi}
                                className="flex items-center gap-1.5 text-[10px] font-mono opacity-90"
                              >
                                <Paperclip className="w-3 h-3" />
                                <span>{mf.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-card/60">
          <div className="text-[11px] text-muted-foreground">
            {parsedMessages.length} messages &bull; {files.length} attached files
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted text-foreground transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading || parsedMessages.length === 0}
              onClick={handleSaveImport}
              className="px-4 py-1.5 text-xs rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <div className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving & Ingesting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Import & Normalize Thread</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
