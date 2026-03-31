import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { createLogger } from "@/lib/logger";

const logger = createLogger("lib/file");

const ALLOWED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_FILE_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE ?? "10485760", 10);
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "/app/uploads/invoices";

export function validateFile(file: File): { valid: boolean; error?: string } {
  logger.debug("Validating file", { name: file.name, type: file.type, size: file.size });

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    logger.warn("File type rejected", { name: file.name, type: file.type });
    return { valid: false, error: "File type not allowed. Use PDF, PNG, or JPEG." };
  }
  if (file.size > MAX_FILE_SIZE) {
    logger.warn("File too large", { name: file.name, size: file.size, max: MAX_FILE_SIZE });
    return { valid: false, error: "File exceeds the 10 MB limit." };
  }

  logger.debug("File validation passed", { name: file.name });
  return { valid: true };
}

export async function saveFile(file: File, invoiceId: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "";
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const sanitized = sanitizeFilename(baseName);
  const filename = `${invoiceId}_${sanitized}.${ext}`;
  const filePath = join(UPLOAD_DIR, filename);

  logger.info("Saving file to disk", { invoiceId, filename, filePath });

  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  logger.info("File saved successfully", { invoiceId, filePath, bytes: buffer.length });
  return filePath;
}

export async function deleteFile(filePath: string): Promise<void> {
  logger.info("Deleting file", { filePath });
  await unlink(filePath);
  logger.info("File deleted", { filePath });
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\-_]/g, "_")
    .slice(0, 50);
}
