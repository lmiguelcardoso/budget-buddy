import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ok, badRequest, notFound, serverError } from "@/lib/response";
import { createLogger } from "@/lib/logger";

const logger = createLogger("api/assets/[id]");

function serializeAsset(asset: Prisma.AssetGetPayload<object>) {
  const price = asset.cachedPrice ?? asset.manualPrice;
  return {
    ...asset,
    quantity: asset.quantity.toString(),
    manualPrice: asset.manualPrice?.toString() ?? null,
    cachedPrice: asset.cachedPrice?.toString() ?? null,
    currentValue: price ? asset.quantity.times(price).toFixed(2) : "0.00",
  };
}

const updateAssetSchema = z
  .object({
    name: z.string().min(1).optional(),
    type: z.enum(["STOCK", "CRYPTO", "TREASURY", "CASH", "OTHER"]).optional(),
    ticker: z.string().min(1).nullable().optional(),
    quantity: z.number().positive().optional(),
    manualPrice: z.number().positive().nullable().optional(),
  })
  .strict();

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateAssetSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }
    const asset = await prisma.asset.update({
      where: { id },
      data: parsed.data,
    });
    logger.info("Asset updated", { id });
    return ok(serializeAsset(asset));
  } catch (err) {
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
    const { id } = await params;
    await prisma.asset.delete({ where: { id } });
    logger.info("Asset deleted", { id });
    return ok({ id });
  } catch (err) {
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
