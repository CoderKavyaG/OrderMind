export interface ParsedChatMessage {
  rawTimestamp: string;
  timestamp: Date;
  senderName: string;
  content: string;
  hasAttachmentIndicator?: boolean;
  attachmentFilename?: string;
}

/**
 * Patterns matching standard WhatsApp chat export lines:
 * Pattern 1 (iOS brackets): [14/10/24, 2:30:15 PM] Name: Message OR [14/10/2024, 14:30:15] Name: Message
 * Pattern 2 (Android dash): 14/10/24, 2:30 pm - Name: Message OR 14/10/2024, 14:30 - Name: Message
 * Pattern 3 (ISO/Alt dash): 2024-10-14, 14:30 - Name: Message OR [2024-10-14 14:30:00] Name: Message
 */
const PATTERNS = [
  // [14/10/24, 2:30:15 PM] Name: Message or [14/10/2024, 14:30] Name: Message
  /^\[(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}(?:,\s*|\s+)\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\]\s+([^:]+):\s*(.*)$/,
  // 14/10/24, 2:30 pm - Name: Message or 14/10/2024, 14:30 - Name: Message
  /^(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}(?:,\s*|\s+)\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\s+-\s+([^:]+):\s*(.*)$/,
  // 2024-10-14 14:30:00 - Name: Message
  /^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)\s+-\s+([^:]+):\s*(.*)$/,
];

// Matches attachment indicators like <attached: filename.ext> or <Media omitted>
const ATTACHMENT_PATTERN = /<attached:\s*([^>]+)>|<Media omitted>|‎?([a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|webp|pdf|mp3|ogg|wav|m4a|aac))\s*\(file attached\)/i;

/**
 * Parse a raw date/time string into a valid JS Date object
 */
export function parseWhatsAppDateTime(dateStr: string): Date {
  const cleanStr = dateStr.replace(/[‎\u200e\u202f]/g, " ").trim();
  const parsed = new Date(cleanStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  // Handle dd/mm/yyyy or dd/mm/yy format
  const parts = cleanStr.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(?:,\s*|\s+)(.*)$/);
  if (parts) {
    const [, day, month, yearPart, timePart] = parts;
    const year = yearPart.length === 2 ? `20${yearPart}` : yearPart;
    const isoLike = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${timePart}`;
    const fallbackDate = new Date(isoLike);
    if (!isNaN(fallbackDate.getTime())) {
      return fallbackDate;
    }
  }

  return new Date();
}

/**
 * Parses raw text content from a WhatsApp exported .txt file into structured messages
 */
export function parseWhatsAppExport(rawText: string): ParsedChatMessage[] {
  // Normalize newlines and strip invisible unicode characters (LTR marks common in exports)
  const normalized = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u200E\u200F\u202A-\u202E]/g, "");

  const lines = normalized.split("\n");
  const messages: ParsedChatMessage[] = [];
  let currentMsg: ParsedChatMessage | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check if line matches a new message header
    let matched = false;
    for (const pattern of PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        if (currentMsg) {
          messages.push(currentMsg);
        }

        const [, timestampStr, senderName, content] = match;
        const attachMatch = content.match(ATTACHMENT_PATTERN);

        currentMsg = {
          rawTimestamp: timestampStr.trim(),
          timestamp: parseWhatsAppDateTime(timestampStr),
          senderName: senderName.trim(),
          content: content.trim(),
          hasAttachmentIndicator: Boolean(attachMatch),
          attachmentFilename: attachMatch ? (attachMatch[1] || attachMatch[2])?.trim() : undefined,
        };
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Continuation of the previous message (e.g. multi-line text)
      if (currentMsg) {
        currentMsg.content += `\n${line}`;
        // Re-check for attachment indicator in subsequent lines
        if (!currentMsg.hasAttachmentIndicator) {
          const attachMatch = line.match(ATTACHMENT_PATTERN);
          if (attachMatch) {
            currentMsg.hasAttachmentIndicator = true;
            currentMsg.attachmentFilename = (attachMatch[1] || attachMatch[2])?.trim();
          }
        }
      }
      // If no currentMsg yet (e.g., system encryption banner), skip safely
    }
  }

  if (currentMsg) {
    messages.push(currentMsg);
  }

  // Resilient fallback: If no strict WhatsApp pattern matched, parse "Sender: message" lines or paragraphs
  if (messages.length === 0 && rawText.trim()) {
    const rawParagraphs = normalized.split("\n").map((l) => l.trim()).filter(Boolean);
    let fallbackSender = "Customer";

    for (let i = 0; i < rawParagraphs.length; i++) {
      const p = rawParagraphs[i];
      const colonIdx = p.indexOf(":");
      
      // If line looks like "Sender Name: message content"
      if (colonIdx > 0 && colonIdx < 35 && !p.startsWith("http")) {
        const potentialSender = p.slice(0, colonIdx).replace(/[\[\]]/g, "").trim();
        const content = p.slice(colonIdx + 1).trim();
        messages.push({
          rawTimestamp: new Date().toISOString(),
          timestamp: new Date(Date.now() + i * 1000),
          senderName: potentialSender,
          content: content || p,
        });
      } else {
        // Plain text message
        messages.push({
          rawTimestamp: new Date().toISOString(),
          timestamp: new Date(Date.now() + i * 1000),
          senderName: i % 2 === 0 ? fallbackSender : "Operator",
          content: p,
        });
      }
    }
  }

  return messages;
}
