"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/hooks/use-settings";

interface NetWorthSummaryProps {
  totalAssets: string;
  totalLiabilities: string;
  netWorth: string;
}

export function NetWorthSummary({
  totalAssets,
  totalLiabilities,
  netWorth,
}: NetWorthSummaryProps) {
  const { t, formatCurrency } = useSettings();
  const isPositive = !netWorth.startsWith("-");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("summary.total_assets")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(totalAssets)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("summary.total_liabilities")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(totalLiabilities)}</p>
        </CardContent>
      </Card>

      <Card className={isPositive ? "border-green-500/50 bg-green-500/5" : "border-red-500/50 bg-red-500/5"}>
        <CardHeader className="pb-2">
          <CardTitle className={`text-sm font-medium ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {t("summary.net_worth")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${isPositive ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
            {formatCurrency(netWorth)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
