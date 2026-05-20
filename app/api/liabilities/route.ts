import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/response";
import { createLogger } from "@/lib/logger";
import { Prisma } from "@prisma/client";

const logger = createLogger("api/liabilities");

function serializeLiability(liability: Prisma.LiabilityGetPayload<object>) {
  return {
    ...liability,
    amount: liability.amount.toString(),
  };
}

const createLiabilitySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["MORTGAGE", "CREDIT_CARD", "STUDENT_LOAN", "OTHER"]),
  amount: z.number().positive(),
});

export async function GET() {
  try {
    const liabilities = await prisma.liability.findMany({
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
    logger.info("Liabilities fetched", { count: liabilities.length });
    return ok(liabilities.map(serializeLiability));
  } catch (err) {
    logger.error("Failed to fetch liabilities", { err });
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createLiabilitySchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }
    const liability = await prisma.liability.create({ data: parsed.data });
    logger.info("Liability created", { id: liability.id });
    return ok(serializeLiability(liability));
  } catch (err) {
    logger.error("Failed to create liability", { err });
    return serverError();
  }
}
