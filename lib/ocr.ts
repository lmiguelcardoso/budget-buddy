import { readFile } from "fs/promises";
import { createLogger } from "@/lib/logger";

const logger = createLogger("lib/ocr");

interface OcrTransaction {
  date: string;
  description: string;
  amount: number;
  merchant?: string;
}

export interface OcrResult {
  invoice_date?: string;
  due_date?: string;
  total_amount?: number;
  card_last_four?: string;
  card_issuer?: string;
  transactions: OcrTransaction[];
}

export async function extractTransactions(
  filePath: string,
  fileType: string,
  apiKey: string
): Promise<OcrResult> {
  logger.info("Starting OCR extraction", { filePath, fileType });

  logger.debug("Reading file from disk", { filePath });
  const buffer = await readFile(filePath);
  const base64 = buffer.toString("base64");
  logger.debug("File encoded to base64", { bytes: buffer.length });

  const mimeType = fileType === "application/pdf" ? "image/jpeg" : fileType;
  const imageUrl = `data:${mimeType};base64,${base64}`;

  logger.info("Sending request to OpenAI GPT-4 Vision");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all transactions from this credit card invoice. Return JSON with: invoice_date, due_date, total_amount, card_last_four, card_issuer, transactions array with (date, description, amount, merchant). Amounts are in Brazilian format (R$ 1.234,56).",
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    logger.error("OpenAI API request failed", {
      status: response.status,
      statusText: response.statusText,
    });
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  logger.info("OpenAI response received", { status: response.status });

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;

  if (!content) {
    logger.error("No content in OpenAI response", { response: JSON.stringify(json) });
    throw new Error("No content returned from OpenAI");
  }

  const result = JSON.parse(content) as OcrResult;
  logger.info("OCR extraction complete", {
    transactionCount: result.transactions?.length ?? 0,
    invoiceDate: result.invoice_date,
    totalAmount: result.total_amount,
  });

  return result;
}
