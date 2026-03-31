import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { validateFile, saveFile, deleteFile } from "@/lib/file";
import { ok, badRequest, serverError } from "@/lib/response";
import { createLogger } from "@/lib/logger";

const logger = createLogger("api/invoices");

export async function POST(request: NextRequest) {
  logger.info("POST /api/invoices — request received");

  const apiKey = request.headers.get("X-OpenAI-API-Key");
  if (!apiKey) {
    logger.warn("Missing X-OpenAI-API-Key header");
    return badRequest("X-OpenAI-API-Key header is required");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err) {
    logger.error("Failed to parse form data", { error: String(err) });
    return badRequest("Invalid form data");
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    logger.warn("No file in request");
    return badRequest("No file provided");
  }

  logger.info("File received", { name: file.name, type: file.type, size: file.size });

  const validation = validateFile(file);
  if (!validation.valid) {
    return badRequest(validation.error!);
  }

  const invoiceId = crypto.randomUUID();
  logger.info("Invoice ID generated", { invoiceId });

  let filePath: string;
  try {
    filePath = await saveFile(file, invoiceId);
  } catch (err) {
    logger.error("Failed to save file", { invoiceId, error: String(err) });
    return serverError("Failed to save file");
  }

  try {
    logger.info("Inserting invoice record", { invoiceId, filePath });
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
    logger.info("Invoice created successfully", { invoiceId });
    return ok(invoice, "Invoice uploaded successfully");
  } catch (err) {
    logger.error("DB insert failed — rolling back file", { invoiceId, error: String(err) });
    await deleteFile(filePath).catch((e) =>
      logger.error("Rollback file delete failed", { filePath, error: String(e) })
    );
    return serverError("Failed to create invoice record");
  }
}

export async function GET() {
  logger.info("GET /api/invoices — request received");
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
    });
    logger.info("Invoices fetched", { count: invoices.length });
    return ok(invoices);
  } catch (err) {
    logger.error("Failed to fetch invoices", { error: String(err) });
    return serverError("Failed to fetch invoices");
  }
}
