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
import { Button, buttonVariants } from "@/components/ui/button";
import { useSettings } from "@/hooks/use-settings";

interface Snapshot {
  id: string;
  createdAt: string;
  totalAssets: string;
  totalLiabilities: string;
  netWorth: string;
  netWorthNum: number;
}

interface DashboardClientProps {
  totalAssets: string;
  totalLiabilities: string;
  netWorth: string;
  byType: Record<string, string>;
  totalAssetsNum: number;
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
  totalAssets,
  totalLiabilities,
  netWorth,
  byType,
  totalAssetsNum,
  snapshots,
}: DashboardClientProps) {
  const { t, formatCurrency } = useSettings();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
        <Link href="/assets" className={buttonVariants({ size: "sm" })}>
          {t("dashboard.manage_assets")}
        </Link>
      </div>

      <NetWorthSummary
        totalAssets={totalAssets}
        totalLiabilities={totalLiabilities}
        netWorth={netWorth}
      />

      {Object.keys(byType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.asset_breakdown")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(byType).map(([type, value]) => {
              const pct = totalAssetsNum > 0
                ? (parseFloat(value) / totalAssetsNum) * 100
                : 0;
              return (
                <div key={type}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={TYPE_BADGE_VARIANT[type] ?? "outline"}>
                        {t(`type.${type}` as Parameters<typeof t>[0])}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground">
                      {formatCurrency(value)} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
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
                  <TableHead className="text-right">{t("snapshot.assets")}</TableHead>
                  <TableHead className="text-right">{t("snapshot.liabilities")}</TableHead>
                  <TableHead className="text-right">{t("snapshot.net_worth")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...snapshots].reverse().map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(s.totalAssets)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(s.totalLiabilities)}</TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        s.netWorthNum >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatCurrency(s.netWorth)}
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
