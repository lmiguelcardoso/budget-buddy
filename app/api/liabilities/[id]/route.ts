import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ok, badRequest, notFound, serverError } from "@/lib/response";
import { createLogger } from "@/lib/logger";

const logger = createLogger("api/liabilities/[id]");

const updateLiabilitySchema = z
  .object({
    name: z.string().min(1).optional(),
    type: z
      .enum(["MORTGAGE", "CREDIT_CARD", "STUDENT_LOAN", "OTHER"])
      .optional(),
    amount: z.number().positive().optional(),
  })
  .strict();

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateLiabilitySchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }
    const liability = await prisma.liability.update({
      where: { id },
      data: parsed.data,
    });
    logger.info("Liability updated", { id });
    return ok({ ...liability, amount: liability.amount.toString() });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return notFound();
    }
    logger.error("Failed to update liability", { err });
    return serverError();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.liability.delete({ where: { id } });
    logger.info("Liability deleted", { id });
    return ok({ id });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return notFound();
    }
    logger.error("Failed to delete liability", { err });
    return serverError();
  }
}
