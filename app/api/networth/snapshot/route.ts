import { prisma } from "@/lib/db";
import { ok, serverError } from "@/lib/response";
import { createLogger } from "@/lib/logger";
import { computeTotals, serializeSnapshot } from "../_helpers";

const logger = createLogger("api/networth/snapshot");

export async function POST() {
  try {
    const [assets, liabilities] = await Promise.all([
      prisma.asset.findMany(),
      prisma.liability.findMany(),
    ]);

    const { usd, brl } = computeTotals(assets, liabilities);

    const snapshot = await prisma.netWorthSnapshot.create({
      data: {
        totalAssetsUsd: usd.totalAssets,
        totalLiabilitiesUsd: usd.totalLiabilities,
        netWorthUsd: usd.netWorth,
        totalAssetsBrl: brl.totalAssets,
        totalLiabilitiesBrl: brl.totalLiabilities,
        netWorthBrl: brl.netWorth,
      },
    });

    logger.info("Snapshot created", {
      id: snapshot.id,
      usd: usd.netWorth.toFixed(2),
      brl: brl.netWorth.toFixed(2),
    });

    return ok(serializeSnapshot(snapshot));
  } catch (err) {
    logger.error("Failed to create snapshot", { err });
    return serverError();
  }
}
