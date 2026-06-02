import { prisma } from "@/lib/db";
import { ok, serverError } from "@/lib/response";
import { createLogger } from "@/lib/logger";
import { authErrorResponse, requireActiveUser } from "@/lib/auth";
import { computeTotals, serializeSnapshot } from "../_helpers";

const logger = createLogger("api/networth/snapshot");

export async function POST() {
  try {
    const user = await requireActiveUser();
    const [assets, liabilities] = await Promise.all([
      prisma.asset.findMany({ where: { userId: user.id } }),
      prisma.liability.findMany({ where: { userId: user.id } }),
    ]);

    const { usd, brl } = computeTotals(assets, liabilities);

    const snapshot = await prisma.netWorthSnapshot.create({
      data: {
        userId: user.id,
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
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;
    logger.error("Failed to create snapshot", { err });
    return serverError();
  }
}
