import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, serverError } from "@/lib/response";
import { createLogger } from "@/lib/logger";
import { Prisma, Asset, Liability } from "@prisma/client";

const logger = createLogger("api/networth");

export async function GET(req: NextRequest) {
  try {
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? "30");

    const [assets, liabilities, snapshots] = await Promise.all([
      prisma.asset.findMany(),
      prisma.liability.findMany(),
      prisma.netWorthSnapshot.findMany({
        orderBy: { createdAt: "asc" },
        take: limit,
        select: { id: true, netWorth: true, totalAssets: true, totalLiabilities: true, createdAt: true },
      }),
    ]);

    const totalAssets = assets.reduce((sum: Prisma.Decimal, a: Asset) => {
      const price = a.cachedPrice ?? a.manualPrice;
      if (!price) return sum;
      return sum.plus(a.quantity.times(price));
    }, new Prisma.Decimal(0));

    const totalLiabilities = liabilities.reduce(
      (sum: Prisma.Decimal, l: Liability) => sum.plus(l.amount),
      new Prisma.Decimal(0)
    );

    const netWorth = totalAssets.minus(totalLiabilities);

    logger.info("Net worth computed", {
      totalAssets: totalAssets.toFixed(2),
      totalLiabilities: totalLiabilities.toFixed(2),
      netWorth: netWorth.toFixed(2),
    });

    return ok({
      totalAssets: totalAssets.toFixed(2),
      totalLiabilities: totalLiabilities.toFixed(2),
      netWorth: netWorth.toFixed(2),
      snapshots: snapshots.map((s) => ({
        ...s,
        netWorth: s.netWorth.toString(),
        totalAssets: s.totalAssets.toString(),
        totalLiabilities: s.totalLiabilities.toString(),
      })),
    });
  } catch (err) {
    logger.error("Failed to compute net worth", { err });
    return serverError();
  }
}
