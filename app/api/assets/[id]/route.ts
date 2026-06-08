import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ok, badRequest, notFound, serverError } from "@/lib/response";
import { createLogger } from "@/lib/logger";
import { authErrorResponse, requireActiveUser } from "@/lib/auth";
import { serializeAsset, updateAssetSchema } from "../_helpers";

const logger = createLogger("api/assets/[id]");

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireActiveUser();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateAssetSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }
    const update = await prisma.asset.updateMany({
      where: { id, userId: user.id },
      data: parsed.data,
    });
    if (update.count === 0) return notFound();

    const asset = await prisma.asset.findUniqueOrThrow({ where: { id } });
    logger.info("Asset updated", { id });
    return ok(serializeAsset(asset));
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return notFound();
    }
    logger.error("Failed to update asset", { err });
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
    const deleted = await prisma.asset.deleteMany({ where: { id, userId: user.id } });
    if (deleted.count === 0) return notFound();
    logger.info("Asset deleted", { id });
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
    logger.error("Failed to delete asset", { err });
    return serverError();
  }
}
