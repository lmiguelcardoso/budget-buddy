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

    const { totalAssets, totalLiabilities, netWorth } = computeTotals(assets, liabilities);

    const snapshot = await prisma.netWorthSnapshot.create({
      data: { totalAssets, totalLiabilities, netWorth },
    });

    logger.info("Snapshot created", { id: snapshot.id, netWorth: netWorth.toFixed(2) });

    return ok(serializeSnapshot(snapshot));
  } catch (err) {
    logger.error("Failed to create snapshot", { err });
    return serverError();
  }
}
