import { prisma } from "@/lib/db";
import { Prisma, Asset, Liability } from "@prisma/client";
import { DashboardClient } from "@/components/dashboard-client";

async function getNetworthData() {
  const [assets, liabilities, snapshots] = await Promise.all([
    prisma.asset.findMany(),
    prisma.liability.findMany(),
    prisma.netWorthSnapshot.findMany({
      orderBy: { createdAt: "asc" },
      take: 10,
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

  const byType = assets.reduce<Record<string, Prisma.Decimal>>(
    (acc: Record<string, Prisma.Decimal>, a: Asset) => {
      const price = a.cachedPrice ?? a.manualPrice;
      if (!price) return acc;
      const val = a.quantity.times(price);
      acc[a.type] = (acc[a.type] ?? new Prisma.Decimal(0)).plus(val);
      return acc;
    },
    {}
  );

  return {
    totalAssets: totalAssets.toFixed(2),
    totalLiabilities: totalLiabilities.toFixed(2),
    netWorth: netWorth.toFixed(2),
    byType: Object.fromEntries(
      Object.entries(byType).map(([k, v]) => [k, v.toFixed(2)])
    ),
    totalAssetsNum: totalAssets.toNumber(),
    snapshots: snapshots.map((s) => ({
      id: s.id,
      createdAt: s.createdAt.toISOString(),
      totalAssets: s.totalAssets.toFixed(2),
      totalLiabilities: s.totalLiabilities.toFixed(2),
      netWorth: s.netWorth.toFixed(2),
      netWorthNum: s.netWorth.toNumber(),
    })),
  };
}

export default async function DashboardPage() {
  const data = await getNetworthData();
  return <DashboardClient {...data} />;
}
