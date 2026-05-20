import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/response";
import { createLogger } from "@/lib/logger";
import { fetchStockPrice, fetchCryptoPrices } from "@/lib/prices";
import { serializeAsset, createAssetSchema } from "./_helpers";

const logger = createLogger("api/assets");

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
