import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, serverError } from "@/lib/response";
import { createLogger } from "@/lib/logger";
import { computeTotals, serializeSnapshot } from "./_helpers";

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

    const { totalAssets, totalLiabilities, netWorth } = computeTotals(assets, liabilities);

    logger.info("Net worth computed", {
      totalAssets: totalAssets.toFixed(2),
      totalLiabilities: totalLiabilities.toFixed(2),
      netWorth: netWorth.toFixed(2),
    });

    return ok({
      totalAssets: totalAssets.toFixed(2),
      totalLiabilities: totalLiabilities.toFixed(2),
      netWorth: netWorth.toFixed(2),
      snapshots: snapshots.map(serializeSnapshot),
    });
  } catch (err) {
    logger.error("Failed to compute net worth", { err });
    return serverError();
  }
}
