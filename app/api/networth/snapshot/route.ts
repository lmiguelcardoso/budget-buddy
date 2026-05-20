import { prisma } from "@/lib/db";
import { ok, serverError } from "@/lib/response";
import { createLogger } from "@/lib/logger";
import { Prisma, Asset, Liability } from "@prisma/client";

const logger = createLogger("api/networth/snapshot");

export async function POST() {
  try {
    const [assets, liabilities] = await Promise.all([
      prisma.asset.findMany(),
      prisma.liability.findMany(),
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

    const snapshot = await prisma.netWorthSnapshot.create({
      data: { totalAssets, totalLiabilities, netWorth },
    });

    logger.info("Snapshot created", { id: snapshot.id, netWorth: netWorth.toFixed(2) });

    return ok({
      ...snapshot,
      totalAssets: snapshot.totalAssets.toString(),
      totalLiabilities: snapshot.totalLiabilities.toString(),
      netWorth: snapshot.netWorth.toString(),
    });
  } catch (err) {
    logger.error("Failed to create snapshot", { err });
    return serverError();
  }
}
