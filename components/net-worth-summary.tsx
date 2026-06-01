"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/hooks/use-settings";

interface CurrencyTotals {
  totalAssets: string;
  totalLiabilities: string;
  netWorth: string;
}

interface NetWorthSummaryProps {
  usd: CurrencyTotals;
  brl: CurrencyTotals;
}

function NetWorthBlock({
  currency,
  totals,
}: {
  currency: "USD" | "BRL";
  totals: CurrencyTotals;
}) {
  const { t, formatCurrency } = useSettings();
  const isPositive = !totals.netWorth.startsWith("-");

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {currency}
      </p>
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("summary.total_assets")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold tabular-nums">
              {formatCurrency(totals.totalAssets, currency)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("summary.total_liabilities")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold tabular-nums">
              {formatCurrency(totals.totalLiabilities, currency)}
            </p>
          </CardContent>
        </Card>

        <Card className={isPositive ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5"}>
          <CardHeader className="pb-1">
            <CardTitle className={`text-xs font-medium ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {t("summary.net_worth")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-bold tabular-nums ${isPositive ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
              {formatCurrency(totals.netWorth, currency)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function NetWorthSummary({ usd, brl }: NetWorthSummaryProps) {
  return (
    <div className="space-y-6">
      <NetWorthBlock currency="USD" totals={usd} />
      <NetWorthBlock currency="BRL" totals={brl} />
    </div>
  );
}
