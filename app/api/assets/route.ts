import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/response";
import { createLogger } from "@/lib/logger";
import { Prisma } from "@prisma/client";
import { fetchStockPrice, fetchCryptoPrices } from "@/lib/prices";

const logger = createLogger("api/assets");

function computeCurrentValue(
  quantity: Prisma.Decimal,
  cachedPrice: Prisma.Decimal | null,
  manualPrice: Prisma.Decimal | null
): string {
  const price = cachedPrice ?? manualPrice;
  if (!price) return "0.00";
  return quantity.times(price).toFixed(2);
}

function serializeAsset(asset: Prisma.AssetGetPayload<object>) {
  return {
    ...asset,
    quantity: asset.quantity.toString(),
    manualPrice: asset.manualPrice?.toString() ?? null,
    cachedPrice: asset.cachedPrice?.toString() ?? null,
    currentValue: computeCurrentValue(
      asset.quantity,
      asset.cachedPrice,
      asset.manualPrice
    ),
  };
}

export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
    logger.info("Assets fetched", { count: assets.length });
    return ok(assets.map(serializeAsset));
  } catch (err) {
    logger.error("Failed to fetch assets", { err });
    return serverError();
  }
}

const createAssetSchema = z
  .object({
    name: z.string().min(1),
    type: z.enum(["STOCK", "CRYPTO", "TREASURY", "CASH", "OTHER"]),
    ticker: z.string().min(1).optional(),
    quantity: z.number().positive(),
    manualPrice: z.number().positive().optional(),
  })
  .superRefine((val, ctx) => {
    if (
      (val.type === "STOCK" || val.type === "CRYPTO") &&
      !val.ticker
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ticker is required for STOCK and CRYPTO assets",
        path: ["ticker"],
      });
    }
    if (
      (val.type === "TREASURY" || val.type === "CASH" || val.type === "OTHER") &&
      val.manualPrice === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "manualPrice is required for TREASURY, CASH, and OTHER assets",
        path: ["manualPrice"],
      });
    }
  });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createAssetSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }
    const { name, type, ticker, quantity, manualPrice } = parsed.data;
    let asset = await prisma.asset.create({
      data: { name, type, ticker, quantity, manualPrice },
    });

    // Immediately fetch live price so currentValue is non-zero on first load
    if (ticker) {
      let price: number | null = null;
      if (type === "STOCK") {
        price = await fetchStockPrice(ticker);
      } else if (type === "CRYPTO") {
        const prices = await fetchCryptoPrices([ticker]);
        price = prices[ticker] ?? null;
      }
      if (price !== null) {
        asset = await prisma.asset.update({
          where: { id: asset.id },
          data: { cachedPrice: price, priceFetchedAt: new Date() },
        });
      }
    }

    logger.info("Asset created", { id: asset.id, type });
    return ok(serializeAsset(asset));
  } catch (err) {
    logger.error("Failed to create asset", { err });
    return serverError();
  }
}
