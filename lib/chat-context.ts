import { prisma } from "@/lib/db";

export async function buildFinancialContext(userId: string): Promise<string> {
  const [assets, liabilities, snapshots] = await Promise.all([
    prisma.asset.findMany({ where: { userId }, orderBy: { type: "asc" } }),
    prisma.liability.findMany({ where: { userId }, orderBy: { type: "asc" } }),
    prisma.netWorthSnapshot.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const lines: string[] = [];

  if (assets.length === 0) {
    lines.push("ASSETS: none registered");
  } else {
    lines.push("ASSETS:");
    for (const a of assets) {
      const price = a.cachedPrice ?? a.manualPrice;
      const value = price ? a.quantity.times(price).toFixed(2) : "price unknown";
      const priceStr = price ? ` @ ${a.currency} ${Number(price).toFixed(2)}` : "";
      lines.push(
        `  - ${a.name} (${a.type})${a.ticker ? ` [${a.ticker}]` : ""}: ${a.quantity.toFixed(4)} units${priceStr} = ${a.currency} ${value}`
      );
    }
  }

  lines.push("");

  if (liabilities.length === 0) {
    lines.push("LIABILITIES: none registered");
  } else {
    lines.push("LIABILITIES:");
    for (const l of liabilities) {
      lines.push(`  - ${l.name} (${l.type}): ${l.currency} ${Number(l.amount).toFixed(2)}`);
    }
  }

  lines.push("");

  if (snapshots.length > 0) {
    const latest = snapshots[0];
    lines.push(
      `NET WORTH (latest): USD ${Number(latest.netWorthUsd).toFixed(2)} / BRL ${Number(latest.netWorthBrl).toFixed(2)}`
    );
    lines.push(`  Total assets: USD ${Number(latest.totalAssetsUsd).toFixed(2)} / BRL ${Number(latest.totalAssetsBrl).toFixed(2)}`);
    lines.push(`  Total liabilities: USD ${Number(latest.totalLiabilitiesUsd).toFixed(2)} / BRL ${Number(latest.totalLiabilitiesBrl).toFixed(2)}`);

    if (snapshots.length > 1) {
      lines.push("");
      lines.push("RECENT SNAPSHOTS (newest first):");
      for (const s of snapshots) {
        const date = s.createdAt.toISOString().split("T")[0];
        lines.push(`  ${date}: USD ${Number(s.netWorthUsd).toFixed(2)} / BRL ${Number(s.netWorthBrl).toFixed(2)}`);
      }
    }
  } else {
    lines.push("NET WORTH: no snapshots recorded yet");
  }

  return lines.join("\n");
}
