import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";

const ALLOWED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_FILE_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE ?? "10485760", 10);
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "/app/uploads/invoices";

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: "File type not allowed. Use PDF, PNG, or JPEG." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File exceeds the 10 MB limit." };
  }
  return { valid: true };
}

export async function saveFile(file: File, invoiceId: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "";
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const sanitized = sanitizeFilename(baseName);
  const filename = `${invoiceId}_${sanitized}.${ext}`;
  const filePath = join(UPLOAD_DIR, filename);

  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return filePath;
}

export async function deleteFile(filePath: string): Promise<void> {
  await unlink(filePath);
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\-_]/g, "_")
    .slice(0, 50);
}
