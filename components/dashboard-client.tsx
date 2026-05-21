"use client";

import Link from "next/link";
import { NetWorthSummary } from "@/components/net-worth-summary";
import { SnapshotButton } from "@/components/snapshot-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { useSettings } from "@/hooks/use-settings";

interface Snapshot {
  id: string;
  createdAt: string;
  netWorthUsd: string;
  netWorthUsdNum: number;
  netWorthBrl: string;
  netWorthBrlNum: number;
}

interface DashboardClientProps {
  usd: { totalAssets: string; totalLiabilities: string; netWorth: string };
  brl: { totalAssets: string; totalLiabilities: string; netWorth: string };
  combined: { usd: string | null; brl: string | null; rate: number | null };
  byType: Record<string, { usd: string; brl: string }>;
  totalAssetsUsd: number;
  totalAssetsBrl: number;
  snapshots: Snapshot[];
}

const TYPE_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  STOCK: "default",
  CRYPTO: "secondary",
  TREASURY: "outline",
  CASH: "outline",
  OTHER: "outline",
};

export function DashboardClient({
  usd,
  brl,
  combined,
  byType,
  totalAssetsUsd,
  totalAssetsBrl,
  snapshots,
}: DashboardClientProps) {
  const { t, formatCurrency } = useSettings();

  const combinedUsdPositive = combined.usd === null || !combined.usd.startsWith("-");
  const combinedBrlPositive = combined.brl === null || !combined.brl.startsWith("-");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
        <Link href="/assets" className={buttonVariants({ size: "sm" })}>
          {t("dashboard.manage_assets")}
        </Link>
      </div>

      {/* Combined net worth */}
      {(combined.usd !== null || combined.brl !== null) && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Total Net Worth
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Card className={combinedUsdPositive ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5"}>
              <CardHeader className="pb-1">
                <CardTitle className={`text-xs font-medium ${combinedUsdPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  All in USD
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold tabular-nums ${combinedUsdPositive ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                  {combined.usd !== null ? formatCurrency(combined.usd, "USD") : "—"}
                </p>
                {combined.rate && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    BRL converted at {combined.rate.toFixed(4)} BRL/USD
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className={combinedBrlPositive ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5"}>
              <CardHeader className="pb-1">
                <CardTitle className={`text-xs font-medium ${combinedBrlPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  All in BRL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold tabular-nums ${combinedBrlPositive ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                  {combined.brl !== null ? formatCurrency(combined.brl, "BRL") : "—"}
                </p>
                {combined.rate && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    USD converted at {combined.rate.toFixed(4)} BRL/USD
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <NetWorthSummary usd={usd} brl={brl} />

      {Object.keys(byType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.asset_breakdown")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {Object.entries(byType).map(([type, values]) => {
              const usdVal = parseFloat(values.usd);
              const brlVal = parseFloat(values.brl);
              const usdPct = totalAssetsUsd > 0 ? (usdVal / totalAssetsUsd) * 100 : 0;
              const brlPct = totalAssetsBrl > 0 ? (brlVal / totalAssetsBrl) * 100 : 0;

              return (
                <div key={type} className="space-y-2">
                  <Badge variant={TYPE_BADGE_VARIANT[type] ?? "outline"}>
                    {t(`type.${type}` as Parameters<typeof t>[0])}
                  </Badge>
                  {usdVal > 0 && (
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>USD</span>
                        <span>{formatCurrency(values.usd, "USD")} ({usdPct.toFixed(1)}%)</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${usdPct}%` }} />
                      </div>
                    </div>
                  )}
                  {brlVal > 0 && (
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>BRL</span>
                        <span>{formatCurrency(values.brl, "BRL")} ({brlPct.toFixed(1)}%)</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-1.5 rounded-full bg-secondary-foreground/30" style={{ width: `${brlPct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t("dashboard.history")}</CardTitle>
          <SnapshotButton />
        </CardHeader>
        <CardContent>
          {snapshots.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("dashboard.no_snapshots")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("snapshot.date")}</TableHead>
                  <TableHead className="text-right">{t("snapshot.usd")}</TableHead>
                  <TableHead className="text-right">{t("snapshot.brl")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...snapshots].reverse().map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString(undefined, {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className={`text-right font-medium tabular-nums ${s.netWorthUsdNum >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {formatCurrency(s.netWorthUsd, "USD")}
                    </TableCell>
                    <TableCell className={`text-right font-medium tabular-nums ${s.netWorthBrlNum >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {formatCurrency(s.netWorthBrl, "BRL")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
