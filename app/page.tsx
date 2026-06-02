import { prisma } from "@/lib/db";
import { Prisma, Asset } from "@prisma/client";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { computeTotals } from "@/app/api/networth/_helpers";
import { fetchUsdBrlRate } from "@/lib/prices";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getNetworthData(userId: string) {
  const [assets, liabilities, snapshots, rate] = await Promise.all([
    prisma.asset.findMany({ where: { userId } }),
    prisma.liability.findMany({ where: { userId } }),
    prisma.netWorthSnapshot.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: 10,
    }),
    fetchUsdBrlRate(),
  ]);

  const { usd, brl } = computeTotals(assets, liabilities);

  const byType = assets.reduce<Record<string, { usd: Prisma.Decimal; brl: Prisma.Decimal }>>(
    (acc, a: Asset) => {
      const price = a.cachedPrice ?? a.manualPrice;
      if (!price) return acc;
      const val = a.quantity.times(price);
      if (!acc[a.type]) acc[a.type] = { usd: new Prisma.Decimal(0), brl: new Prisma.Decimal(0) };
      if (a.currency === "USD") acc[a.type].usd = acc[a.type].usd.plus(val);
      else acc[a.type].brl = acc[a.type].brl.plus(val);
      return acc;
    },
    {}
  );

  // Combined totals using live exchange rate
  // netWorthBrl (BRL) → USD: divide by rate; netWorthUsd (USD) → BRL: multiply by rate
  const combinedUsd = rate !== null
    ? usd.netWorth.plus(brl.netWorth.dividedBy(rate)).toFixed(2)
    : null;
  const combinedBrl = rate !== null
    ? usd.netWorth.times(rate).plus(brl.netWorth).toFixed(2)
    : null;

  return {
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
    combined: { usd: combinedUsd, brl: combinedBrl, rate },
    byType: Object.fromEntries(
      Object.entries(byType).map(([k, v]) => [k, { usd: v.usd.toFixed(2), brl: v.brl.toFixed(2) }])
    ),
    totalAssetsUsd: usd.totalAssets.toNumber(),
    totalAssetsBrl: brl.totalAssets.toNumber(),
    snapshots: snapshots.map((s) => ({
      id: s.id,
      createdAt: s.createdAt.toISOString(),
      netWorthUsd: s.netWorthUsd.toFixed(2),
      netWorthUsdNum: s.netWorthUsd.toNumber(),
      netWorthBrl: s.netWorthBrl.toFixed(2),
      netWorthBrlNum: s.netWorthBrl.toNumber(),
    })),
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (user?.status !== "ACTIVE") redirect("/login");

  const data = await getNetworthData(user.id);
  return <DashboardClient {...data} />;
}
