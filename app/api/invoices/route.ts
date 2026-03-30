import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { validateFile, saveFile, deleteFile } from "@/lib/file";
import { ok, badRequest, serverError } from "@/lib/response";

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("X-OpenAI-API-Key");
  if (!apiKey) {
    return badRequest("X-OpenAI-API-Key header is required");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return badRequest("Invalid form data");
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return badRequest("No file provided");
  }

  const validation = validateFile(file);
  if (!validation.valid) {
    return badRequest(validation.error!);
  }

  const invoiceId = crypto.randomUUID();

  let filePath: string;
  try {
    filePath = await saveFile(file, invoiceId);
  } catch {
    return serverError("Failed to save file");
  }

  try {
    const invoice = await prisma.invoice.create({
      data: {
        id: invoiceId,
        fileName: file.name,
        filePath,
        fileSize: file.size,
        fileType: file.type,
        processingStatus: "pending",
      },
    });
    return ok(invoice, "Invoice uploaded successfully");
  } catch {
    await deleteFile(filePath).catch(() => null);
    return serverError("Failed to create invoice record");
  }
}

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
    });
    return ok(invoices);
  } catch {
    return serverError("Failed to fetch invoices");
  }
}
