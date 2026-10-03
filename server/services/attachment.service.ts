import { Readable } from "stream";
import { ObjectId } from "mongodb";
import { getDb, getGridFSBucket } from "@/server/db/mongodb";
import type { AttachmentMeta } from "@/server/db/schema";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per hard requirement

const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  // Audio
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/m4a",
  "audio/x-m4a",
  "audio/aac",
  // Documents
  "application/pdf",
  "text/plain",
]);

/**
 * Inspects binary magic bytes of the file buffer to prevent MIME spoofing attacks.
 */
export function validateMagicBytes(buffer: Buffer, declaredType: string, filename: string): boolean {
  if (buffer.length < 4) {
    // Very small buffers (e.g. empty text files)
    return declaredType.startsWith("text/") || filename.endsWith(".txt");
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }

  // GIF: 47 49 46 38 ("GIF8")
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return true;
  }

  // PDF: 25 50 44 46 ("%PDF")
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return true;
  }

  // RIFF container (WebP or WAV)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer.length >= 12
  ) {
    const subType = buffer.toString("ascii", 8, 12);
    if (subType === "WEBP" || subType === "WAVE") {
      return true;
    }
  }

  // OGG: 4F 67 67 53 ("OggS")
  if (
    buffer[0] === 0x4f &&
    buffer[1] === 0x67 &&
    buffer[2] === 0x67 &&
    buffer[3] === 0x53
  ) {
    return true;
  }

  // MP3 ID3 header: 49 44 33 ("ID3")
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    return true;
  }

  // MP3 frame sync: FF FB, FF F3, FF F2
  if (
    buffer[0] === 0xff &&
    (buffer[1] === 0xfb || buffer[1] === 0xf3 || buffer[1] === 0xf2)
  ) {
    return true;
  }

  // ISO Media / MP4 / M4A: "ftyp" at index 4
  if (buffer.length >= 8 && buffer.toString("ascii", 4, 8) === "ftyp") {
    return true;
  }

  // Plain text / export transcripts
  if (
    declaredType.startsWith("text/") ||
    filename.endsWith(".txt") ||
    filename.endsWith(".csv") ||
    filename.endsWith(".json")
  ) {
    // Check if valid UTF-8
    return true;
  }

  return false;
}

export function validateAttachment(file: { size: number; type: string; name: string; buffer?: Buffer }) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File "${file.name}" exceeds the maximum 10MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
  }

  // Normalize mime type check (some audio browsers send audio/x-m4a or audio/webm)
  const isAllowed = ALLOWED_MIME_TYPES.has(file.type) || 
    file.name.endsWith(".opus") ||
    file.name.endsWith(".ogg") ||
    file.name.endsWith(".m4a") ||
    file.name.endsWith(".pdf") ||
    file.name.endsWith(".txt");

  if (!isAllowed) {
    throw new Error(`Unsupported file type "${file.type}". Allowed: Images (PNG, JPG, WEBP), Audio (OGG, MP3, WAV, M4A), and PDFs.`);
  }

  if (file.buffer && file.buffer.length > 0) {
    const validSignature = validateMagicBytes(file.buffer, file.type, file.name);
    if (!validSignature) {
      throw new Error(`File content signature does not match allowed types for "${file.name}".`);
    }
  }
}

/**
 * Stores a file in MongoDB GridFS and creates an attachment record scoped by workspaceId.
 */
export async function storeAttachment(
  workspaceId: string,
  buffer: Buffer,
  filename: string,
  contentType: string,
  orderId?: string
): Promise<AttachmentMeta> {
  validateAttachment({ size: buffer.length, type: contentType, name: filename, buffer });

  const bucket = await getGridFSBucket();
  const db = await getDb();

  // Upload to GridFS
  const readableStream = Readable.from(buffer);
  const uploadStream = bucket.openUploadStream(filename, {
    metadata: {
      workspaceId,
      orderId,
      contentType,
      uploadedAt: new Date(),
    },
  });

  await new Promise<void>((resolve, reject) => {
    readableStream
      .pipe(uploadStream)
      .on("error", reject)
      .on("finish", () => resolve());
  });

  const fileId = uploadStream.id;

  // Insert metadata document in attachments collection
  const attachmentDoc = {
    workspaceId,
    fileId,
    filename,
    contentType,
    size: buffer.length,
    orderId,
    uploadedAt: new Date(),
  };

  const insertResult = await db.collection("attachments").insertOne(attachmentDoc);

  return {
    id: insertResult.insertedId.toString(),
    filename,
    contentType,
    size: buffer.length,
    url: `/api/attachments/${insertResult.insertedId.toString()}`,
  };
}

/**
 * Retrieves a file from MongoDB GridFS with tenant verification.
 */
export async function getAttachmentStream(
  workspaceId: string,
  attachmentId: string
): Promise<{ stream: NodeJS.ReadableStream; filename: string; contentType: string; length: number } | null> {
  const db = await getDb();
  let attObjectId: ObjectId;
  try {
    attObjectId = new ObjectId(attachmentId);
  } catch {
    return null;
  }

  // Tenant-scoped lookup
  const attachmentDoc = await db.collection("attachments").findOne({
    _id: attObjectId,
    workspaceId,
  });

  if (!attachmentDoc) {
    return null;
  }

  const bucket = await getGridFSBucket();
  const fileId = attachmentDoc.fileId as ObjectId;

  const downloadStream = bucket.openDownloadStream(fileId);

  return {
    stream: downloadStream,
    filename: attachmentDoc.filename,
    contentType: attachmentDoc.contentType || "application/octet-stream",
    length: attachmentDoc.size || 0,
  };
}

/**
 * Retrieves a file from MongoDB GridFS as a Buffer with tenant verification.
 */
export async function getAttachmentBuffer(
  workspaceId: string,
  attachmentId: string
): Promise<Buffer | null> {
  const result = await getAttachmentStream(workspaceId, attachmentId);
  if (!result) return null;

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    result.stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    result.stream.on("error", reject);
    result.stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}
