import { Prisma, Asset, Liability } from "@prisma/client";

export function computeTotals(assets: Asset[], liabilities: Liability[]) {
  const totalAssets = assets.reduce((sum: Prisma.Decimal, a: Asset) => {
    const price = a.cachedPrice ?? a.manualPrice;
    if (!price) return sum;
    return sum.plus(a.quantity.times(price));
  }, new Prisma.Decimal(0));

  const totalLiabilities = liabilities.reduce(
    (sum: Prisma.Decimal, l: Liability) => sum.plus(l.amount),
    new Prisma.Decimal(0)
  );

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets.minus(totalLiabilities),
  };
}

export function serializeSnapshot(s: {
  id: string;
  netWorth: Prisma.Decimal;
  totalAssets: Prisma.Decimal;
  totalLiabilities: Prisma.Decimal;
  createdAt: Date;
}) {
  return {
    ...s,
    netWorth: s.netWorth.toString(),
    totalAssets: s.totalAssets.toString(),
    totalLiabilities: s.totalLiabilities.toString(),
  };
}
