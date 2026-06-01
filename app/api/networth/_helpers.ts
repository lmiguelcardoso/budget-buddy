import { Prisma, Asset, Liability } from "@prisma/client";

function sumByCurrency(
  items: { currency: string; value: Prisma.Decimal }[]
): { usd: Prisma.Decimal; brl: Prisma.Decimal } {
  return items.reduce(
    (acc, item) => {
      if (item.currency === "USD") acc.usd = acc.usd.plus(item.value);
      else if (item.currency === "BRL") acc.brl = acc.brl.plus(item.value);
      return acc;
    },
    { usd: new Prisma.Decimal(0), brl: new Prisma.Decimal(0) }
  );
}

export function computeTotals(assets: Asset[], liabilities: Liability[]) {
  const assetValues = assets.map((a) => {
    const price = a.cachedPrice ?? a.manualPrice;
    return {
      currency: a.currency,
      value: price ? a.quantity.times(price) : new Prisma.Decimal(0),
    };
  });

  const liabilityValues = liabilities.map((l) => ({
    currency: l.currency,
    value: l.amount,
  }));

  const totalAssets = sumByCurrency(assetValues);
  const totalLiabilities = sumByCurrency(liabilityValues);

  return {
    usd: {
      totalAssets: totalAssets.usd,
      totalLiabilities: totalLiabilities.usd,
      netWorth: totalAssets.usd.minus(totalLiabilities.usd),
    },
    brl: {
      totalAssets: totalAssets.brl,
      totalLiabilities: totalLiabilities.brl,
      netWorth: totalAssets.brl.minus(totalLiabilities.brl),
    },
  };
}

export function serializeSnapshot(s: {
  id: string;
  totalAssetsUsd: Prisma.Decimal;
  totalLiabilitiesUsd: Prisma.Decimal;
  netWorthUsd: Prisma.Decimal;
  totalAssetsBrl: Prisma.Decimal;
  totalLiabilitiesBrl: Prisma.Decimal;
  netWorthBrl: Prisma.Decimal;
  createdAt: Date;
}) {
  return {
    ...s,
    totalAssetsUsd: s.totalAssetsUsd.toString(),
    totalLiabilitiesUsd: s.totalLiabilitiesUsd.toString(),
    netWorthUsd: s.netWorthUsd.toString(),
    totalAssetsBrl: s.totalAssetsBrl.toString(),
    totalLiabilitiesBrl: s.totalLiabilitiesBrl.toString(),
    netWorthBrl: s.netWorthBrl.toString(),
  };
}
