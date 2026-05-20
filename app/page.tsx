import { prisma } from "@/lib/db";
import { Prisma, Asset, Liability } from "@prisma/client";
import { DashboardClient } from "@/components/dashboard-client";
import { computeTotals } from "@/app/api/networth/_helpers";

async function getNetworthData() {
  const [assets, liabilities, snapshots] = await Promise.all([
    prisma.asset.findMany(),
    prisma.liability.findMany(),
    prisma.netWorthSnapshot.findMany({
      orderBy: { createdAt: "asc" },
      take: 10,
    }),
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

  const totalAssetsUsd = usd.totalAssets.toNumber();
  const totalAssetsBrl = brl.totalAssets.toNumber();

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
    byType: Object.fromEntries(
      Object.entries(byType).map(([k, v]) => [k, { usd: v.usd.toFixed(2), brl: v.brl.toFixed(2) }])
    ),
    totalAssetsUsd,
    totalAssetsBrl,
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
  const data = await getNetworthData();
  return <DashboardClient {...data} />;
}
