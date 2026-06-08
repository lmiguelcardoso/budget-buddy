import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ok, badRequest, notFound, serverError } from "@/lib/response";
import { createLogger } from "@/lib/logger";
import { authErrorResponse, requireActiveUser } from "@/lib/auth";
import { serializeLiability, updateLiabilitySchema } from "../_helpers";

const logger = createLogger("api/liabilities/[id]");

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireActiveUser();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateLiabilitySchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }
    const update = await prisma.liability.updateMany({
      where: { id, userId: user.id },
      data: parsed.data,
    });
    if (update.count === 0) return notFound();

    const liability = await prisma.liability.findUniqueOrThrow({ where: { id } });
    logger.info("Liability updated", { id });
    return ok(serializeLiability(liability));
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;
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
    const user = await requireActiveUser();
    const { id } = await params;
    const deleted = await prisma.liability.deleteMany({ where: { id, userId: user.id } });
    if (deleted.count === 0) return notFound();
    logger.info("Liability deleted", { id });
    return ok({ id });
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;
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
