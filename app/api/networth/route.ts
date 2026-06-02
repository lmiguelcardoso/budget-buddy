import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, serverError } from "@/lib/response";
import { createLogger } from "@/lib/logger";
import { authErrorResponse, requireActiveUser } from "@/lib/auth";
import { computeTotals, serializeSnapshot } from "./_helpers";

const logger = createLogger("api/networth");

export async function GET(req: NextRequest) {
  try {
    const user = await requireActiveUser();
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? "30");

    const [assets, liabilities, snapshots] = await Promise.all([
      prisma.asset.findMany({ where: { userId: user.id } }),
      prisma.liability.findMany({ where: { userId: user.id } }),
      prisma.netWorthSnapshot.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
        take: limit,
      }),
    ]);

    const { usd, brl } = computeTotals(assets, liabilities);

    logger.info("Net worth computed", {
      usd: usd.netWorth.toFixed(2),
      brl: brl.netWorth.toFixed(2),
    });

    return ok({
      usd: {
        totalAssets: usd.totalAssets.toFixed(2),
        totalLiabilities: usd.totalLiabilities.toFixed(2),
        netWorth: usd.netWorth.toFixed(2),
      },
      brl: {
        totalAssets: brl.totalAssets.toFixed(2),
        totalLiabilities: brl.totalLiabilities.toFixed(2),
        netWorth: brl.netWorth.toFixed(2),
      },
      snapshots: snapshots.map(serializeSnapshot),
    });
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;
    logger.error("Failed to compute net worth", { err });
    return serverError();
  }
}
