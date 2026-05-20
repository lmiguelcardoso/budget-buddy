import Link from "next/link";
import { prisma } from "@/lib/db";
import { Prisma, Asset, Liability } from "@prisma/client";
import { NetWorthSummary } from "@/components/net-worth-summary";
import { SnapshotButton } from "@/components/snapshot-button";

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

  return { totalAssets, totalLiabilities, netWorth, byType, assets, snapshots };
}

const TYPE_LABELS: Record<string, string> = {
  STOCK: "Stocks",
  CRYPTO: "Crypto",
  TREASURY: "Treasuries",
  CASH: "Cash",
  OTHER: "Other",
};

export default async function DashboardPage() {
  const { totalAssets, totalLiabilities, netWorth, byType, snapshots } =
    await getNetworthData();

  const totalAssetsNum = totalAssets.toNumber();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Net Worth</h1>
          <Link
            href="/assets"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Manage Assets
          </Link>
        </div>

        <NetWorthSummary
          totalAssets={totalAssets.toFixed(2)}
          totalLiabilities={totalLiabilities.toFixed(2)}
          netWorth={netWorth.toFixed(2)}
        />

        {Object.keys(byType).length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Asset Breakdown
            </h2>
            <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              {Object.entries(byType).map(([type, value]: [string, Prisma.Decimal]) => {
                const pct =
                  totalAssetsNum > 0
                    ? (value.toNumber() / totalAssetsNum) * 100
                    : 0;
                return (
                  <div key={type}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        {TYPE_LABELS[type] ?? type}
                      </span>
                      <span className="text-gray-500">
                        {formatCurrency(value.toFixed(2))} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Net Worth History
            </h2>
            <SnapshotButton />
          </div>

          {snapshots.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              No snapshots yet. Click &ldquo;Take Snapshot&rdquo; to record today&apos;s net worth.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Assets</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Liabilities</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Net Worth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...snapshots].reverse().map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(s.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {formatCurrency(s.totalAssets.toFixed(2))}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {formatCurrency(s.totalLiabilities.toFixed(2))}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${
                          s.netWorth.gte(0) ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(s.netWorth.toFixed(2))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
}
