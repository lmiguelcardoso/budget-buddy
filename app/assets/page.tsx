"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AssetForm } from "@/components/asset-form";
import { LiabilityForm } from "@/components/liability-form";

type AssetType = "STOCK" | "CRYPTO" | "TREASURY" | "CASH" | "OTHER";
type LiabilityType = "MORTGAGE" | "CREDIT_CARD" | "STUDENT_LOAN" | "OTHER";

interface Asset {
  id: string;
  name: string;
  type: AssetType;
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
  amount: string;
}

const TYPE_LABELS: Record<string, string> = {
  STOCK: "Stock",
  CRYPTO: "Crypto",
  TREASURY: "Treasury",
  CASH: "Cash",
  OTHER: "Other",
  MORTGAGE: "Mortgage",
  CREDIT_CARD: "Credit Card",
  STUDENT_LOAN: "Student Loan",
};

function formatCurrency(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showLiabilityForm, setShowLiabilityForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{ updated: number; failed: string[] } | null>(null);

  const fetchData = useCallback(async () => {
    const [assetsRes, liabRes] = await Promise.all([
      fetch("/api/assets"),
      fetch("/api/liabilities"),
    ]);
    const [assetsJson, liabJson] = await Promise.all([
      assetsRes.json(),
      liabRes.json(),
    ]);
    if (assetsJson.success) setAssets(assetsJson.data);
    if (liabJson.success) setLiabilities(liabJson.data);
  }, []);

  useEffect(() => {
    fetchData();
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
      if (json.success) {
        setRefreshResult(json.data);
        fetchData();
      }
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              ← Dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              Assets &amp; Liabilities
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshPrices}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh Prices"}
          </Button>
        </div>

        {refreshResult && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Updated {refreshResult.updated} price(s).
            {refreshResult.failed.length > 0 && (
              <span className="ml-1 text-red-600">
                Failed: {refreshResult.failed.join(", ")}
              </span>
            )}
          </div>
        )}

        {/* Assets section */}
        <section className="mb-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Assets</h2>
            <Button
              size="sm"
              onClick={() => {
                setEditingAsset(null);
                setShowAssetForm(true);
              }}
            >
              + Add Asset
            </Button>
          </div>

          {(showAssetForm && !editingAsset) && (
            <div className="mb-4">
              <AssetForm
                onSuccess={() => {
                  setShowAssetForm(false);
                  fetchData();
                }}
                onCancel={() => setShowAssetForm(false)}
              />
            </div>
          )}

          {assets.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              No assets yet. Add your first asset above.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Quantity</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Price</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Value</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assets.map((asset) => (
                    <>
                      <tr key={asset.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {asset.name}
                          {asset.ticker && (
                            <span className="ml-1 text-xs text-gray-400">
                              ({asset.ticker})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {TYPE_LABELS[asset.type] ?? asset.type}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {parseFloat(asset.quantity).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {asset.cachedPrice
                            ? formatCurrency(asset.cachedPrice)
                            : asset.manualPrice
                            ? formatCurrency(asset.manualPrice)
                            : "—"}
                          {asset.priceFetchedAt && (
                            <span className="ml-1 text-xs text-gray-400" title={`Fetched ${new Date(asset.priceFetchedAt).toLocaleString()}`}>
                              ↻
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(asset.currentValue)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setEditingAsset(asset);
                              setShowAssetForm(false);
                            }}
                            className="mr-2 text-xs text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteAsset(asset.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                      {editingAsset?.id === asset.id && (
                        <tr key={`${asset.id}-edit`}>
                          <td colSpan={6} className="px-4 py-3">
                            <AssetForm
                              initialValues={editingAsset}
                              onSuccess={() => {
                                setEditingAsset(null);
                                fetchData();
                              }}
                              onCancel={() => setEditingAsset(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Liabilities section */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Liabilities</h2>
            <Button
              size="sm"
              onClick={() => {
                setEditingLiability(null);
                setShowLiabilityForm(true);
              }}
            >
              + Add Liability
            </Button>
          </div>

          {(showLiabilityForm && !editingLiability) && (
            <div className="mb-4">
              <LiabilityForm
                onSuccess={() => {
                  setShowLiabilityForm(false);
                  fetchData();
                }}
                onCancel={() => setShowLiabilityForm(false)}
              />
            </div>
          )}

          {liabilities.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              No liabilities yet. Add your debts above.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {liabilities.map((liability) => (
                    <>
                      <tr key={liability.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {liability.name}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {TYPE_LABELS[liability.type] ?? liability.type}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-red-600">
                          {formatCurrency(liability.amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setEditingLiability(liability);
                              setShowLiabilityForm(false);
                            }}
                            className="mr-2 text-xs text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteLiability(liability.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                      {editingLiability?.id === liability.id && (
                        <tr key={`${liability.id}-edit`}>
                          <td colSpan={4} className="px-4 py-3">
                            <LiabilityForm
                              initialValues={editingLiability}
                              onSuccess={() => {
                                setEditingLiability(null);
                                fetchData();
                              }}
                              onCancel={() => setEditingLiability(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
