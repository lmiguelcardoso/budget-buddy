"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type AssetType = "STOCK" | "CRYPTO" | "TREASURY" | "CASH" | "OTHER";

interface AssetFormProps {
  initialValues?: {
    id?: string;
    name: string;
    type: AssetType;
    ticker?: string | null;
    quantity: string;
    manualPrice?: string | null;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const CRYPTO_COINS: { id: string; label: string }[] = [
  { id: "bitcoin", label: "Bitcoin (BTC)" },
  { id: "ethereum", label: "Ethereum (ETH)" },
  { id: "tether", label: "Tether (USDT)" },
  { id: "binancecoin", label: "BNB (BNB)" },
  { id: "solana", label: "Solana (SOL)" },
  { id: "usd-coin", label: "USD Coin (USDC)" },
  { id: "ripple", label: "XRP (XRP)" },
  { id: "staked-ether", label: "Lido Staked ETH (stETH)" },
  { id: "dogecoin", label: "Dogecoin (DOGE)" },
  { id: "tron", label: "TRON (TRX)" },
  { id: "cardano", label: "Cardano (ADA)" },
  { id: "avalanche-2", label: "Avalanche (AVAX)" },
  { id: "chainlink", label: "Chainlink (LINK)" },
  { id: "polkadot", label: "Polkadot (DOT)" },
  { id: "matic-network", label: "Polygon (MATIC)" },
  { id: "litecoin", label: "Litecoin (LTC)" },
  { id: "near", label: "NEAR Protocol (NEAR)" },
  { id: "uniswap", label: "Uniswap (UNI)" },
  { id: "internet-computer", label: "Internet Computer (ICP)" },
  { id: "monero", label: "Monero (XMR)" },
];

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: "STOCK", label: "Stock" },
  { value: "CRYPTO", label: "Crypto" },
  { value: "TREASURY", label: "Treasury" },
  { value: "CASH", label: "Cash" },
  { value: "OTHER", label: "Other" },
];

export function AssetForm({ initialValues, onSuccess, onCancel }: AssetFormProps) {
  const isEdit = !!initialValues?.id;
  const [name, setName] = useState(initialValues?.name ?? "");
  const [type, setType] = useState<AssetType>(initialValues?.type ?? "STOCK");
  const [ticker, setTicker] = useState(initialValues?.ticker ?? "");
  const [quantity, setQuantity] = useState(initialValues?.quantity ?? "");
  const [manualPrice, setManualPrice] = useState(initialValues?.manualPrice ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const needsTicker = type === "STOCK" || type === "CRYPTO";
  const needsManualPrice = type === "TREASURY" || type === "CASH" || type === "OTHER";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const body: Record<string, unknown> = {
      name,
      type,
      quantity: parseFloat(quantity),
    };
    if (needsTicker) body.ticker = ticker;
    if (needsManualPrice) body.manualPrice = parseFloat(manualPrice);

    const url = isEdit
      ? `/api/assets/${initialValues!.id}`
      : "/api/assets";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Something went wrong");
        return;
      }
      onSuccess();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <h3 className="font-semibold text-gray-800">
        {isEdit ? "Edit Asset" : "Add Asset"}
      </h3>

      {error && (
        <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Apple Inc."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as AssetType);
              setTicker("");
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ASSET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {type === "CRYPTO" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Coin</label>
            <select
              required
              value={ticker}
              onChange={(e) => {
                const id = e.target.value;
                setTicker(id);
                if (!name) {
                  const coin = CRYPTO_COINS.find((c) => c.id === id);
                  if (coin) setName(coin.label.split(" (")[0]);
                }
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a coin…</option>
              {CRYPTO_COINS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {type === "STOCK" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Ticker Symbol</label>
            <input
              required
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. AAPL"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Quantity</label>
          <input
            required
            type="number"
            min="0"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 10"
          />
        </div>

        {needsManualPrice && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Value (USD)
            </label>
            <input
              required
              type="number"
              min="0"
              step="any"
              value={manualPrice}
              onChange={(e) => setManualPrice(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 1000.00"
            />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading} size="sm">
          {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Asset"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
