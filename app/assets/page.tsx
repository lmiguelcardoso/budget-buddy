"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Pencil, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AssetForm } from "@/components/asset-form";
import { LiabilityForm } from "@/components/liability-form";
import { useSettings } from "@/hooks/use-settings";

type AssetType = "STOCK" | "CRYPTO" | "TREASURY" | "CASH" | "OTHER";
type LiabilityType = "MORTGAGE" | "CREDIT_CARD" | "STUDENT_LOAN" | "OTHER";

type AppCurrency = "USD" | "BRL";

interface Asset {
  id: string;
  name: string;
  type: AssetType;
  currency: AppCurrency;
  ticker: string | null;
  quantity: string;
  manualPrice: string | null;
  cachedPrice: string | null;
  priceFetchedAt: string | null;
  currentValue: string;
}

interface Liability {
  id: string;
  name: string;
  type: LiabilityType;
  currency: AppCurrency;
  amount: string;
}

const TYPE_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  STOCK: "default",
  CRYPTO: "secondary",
  TREASURY: "outline",
  CASH: "outline",
  OTHER: "outline",
  MORTGAGE: "outline",
  CREDIT_CARD: "secondary",
  STUDENT_LOAN: "outline",
};

export default function AssetsPage() {
  const { t, formatCurrency } = useSettings();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [addAssetOpen, setAddAssetOpen] = useState(false);
  const [addLiabilityOpen, setAddLiabilityOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{ updated: number; failed: string[] } | null>(null);

  const fetchData = useCallback(async () => {
    const [assetsRes, liabRes] = await Promise.all([
      fetch("/api/assets"),
      fetch("/api/liabilities"),
    ]);
    const [assetsJson, liabJson] = await Promise.all([assetsRes.json(), liabRes.json()]);
    if (assetsJson.success) setAssets(assetsJson.data);
    if (liabJson.success) setLiabilities(liabJson.data);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      fetchData();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [fetchData]);

  async function deleteAsset(id: string) {
    await fetch(`/api/assets/${id}`, { method: "DELETE" });
    fetchData();
  }

  async function deleteLiability(id: string) {
    await fetch(`/api/liabilities/${id}`, { method: "DELETE" });
    fetchData();
  }

  async function handleRefreshPrices() {
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const res = await fetch("/api/assets/refresh-prices", { method: "POST" });
      const json = await res.json();
      if (json.success) { setRefreshResult(json.data); fetchData(); }
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← {t("nav.dashboard")}
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{t("assets.title")}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefreshPrices} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? t("assets.refreshing") : t("assets.refresh_prices")}
        </Button>
      </div>

      {refreshResult && (
        <p className="rounded-md border border-border bg-muted px-4 py-2.5 text-sm">
          {t("assets.refresh_result").replace("{n}", String(refreshResult.updated))}
          {refreshResult.failed.length > 0 && (
            <span className="ml-1 text-destructive">
              {t("assets.refresh_failed")} {refreshResult.failed.join(", ")}
            </span>
          )}
        </p>
      )}

      {/* Assets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t("assets.section")}</CardTitle>
          <Button size="sm" onClick={() => setAddAssetOpen(true)}>
            {t("assets.add")}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {assets.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              {t("assets.empty")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("assets.col.name")}</TableHead>
                  <TableHead>{t("assets.col.type")}</TableHead>
                  <TableHead className="text-right">{t("assets.col.quantity")}</TableHead>
                  <TableHead className="text-right">{t("assets.col.price")}</TableHead>
                  <TableHead className="text-right">{t("assets.col.value")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <Fragment key={asset.id}>
                    <TableRow>
                      <TableCell className="font-medium">
                        {asset.name}
                        {asset.ticker && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({asset.ticker})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={TYPE_BADGE_VARIANT[asset.type] ?? "outline"}>
                          {t(`type.${asset.type}` as Parameters<typeof t>[0])}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {parseFloat(asset.quantity).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {asset.cachedPrice || asset.manualPrice ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="cursor-default">
                                {formatCurrency(asset.cachedPrice ?? asset.manualPrice ?? "0", asset.currency)}
                              </span>
                            </TooltipTrigger>
                            {asset.priceFetchedAt && (
                              <TooltipContent>
                                Updated {new Date(asset.priceFetchedAt).toLocaleString()}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(asset.currentValue, asset.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setEditingAsset(asset)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteAsset(asset.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Liabilities */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t("liabilities.section")}</CardTitle>
          <Button size="sm" onClick={() => setAddLiabilityOpen(true)}>
            {t("liabilities.add")}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {liabilities.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              {t("liabilities.empty")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("liabilities.col.name")}</TableHead>
                  <TableHead>{t("liabilities.col.type")}</TableHead>
                  <TableHead className="text-right">{t("liabilities.col.amount")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {liabilities.map((liability) => (
                  <Fragment key={liability.id}>
                    <TableRow>
                      <TableCell className="font-medium">{liability.name}</TableCell>
                      <TableCell>
                        <Badge variant={TYPE_BADGE_VARIANT[liability.type] ?? "outline"}>
                          {t(`type.${liability.type}` as Parameters<typeof t>[0])}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-destructive tabular-nums">
                        {formatCurrency(liability.amount, liability.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setEditingLiability(liability)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteLiability(liability.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={addAssetOpen} onOpenChange={setAddAssetOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{t("form.add_asset")}</DialogTitle></DialogHeader>
          <AssetForm
            onSuccess={() => { setAddAssetOpen(false); fetchData(); }}
            onCancel={() => setAddAssetOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingAsset} onOpenChange={(open) => !open && setEditingAsset(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{t("form.edit_asset")}</DialogTitle></DialogHeader>
          {editingAsset && (
            <AssetForm
              initialValues={editingAsset}
              onSuccess={() => { setEditingAsset(null); fetchData(); }}
              onCancel={() => setEditingAsset(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={addLiabilityOpen} onOpenChange={setAddLiabilityOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{t("form.add_liability")}</DialogTitle></DialogHeader>
          <LiabilityForm
            onSuccess={() => { setAddLiabilityOpen(false); fetchData(); }}
            onCancel={() => setAddLiabilityOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingLiability} onOpenChange={(open) => !open && setEditingLiability(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{t("form.edit_liability")}</DialogTitle></DialogHeader>
          {editingLiability && (
            <LiabilityForm
              initialValues={editingLiability}
              onSuccess={() => { setEditingLiability(null); fetchData(); }}
              onCancel={() => setEditingLiability(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
