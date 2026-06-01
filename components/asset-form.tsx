"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/hooks/use-settings";

type AssetType = "STOCK" | "CRYPTO" | "TREASURY" | "CASH" | "OTHER";
type AppCurrency = "USD" | "BRL";

interface AssetFormProps {
  initialValues?: {
    id?: string;
    name: string;
    type: AssetType;
    currency: AppCurrency;
    ticker?: string | null;
    quantity: string;
    manualPrice?: string | null;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const ASSET_TYPE_KEYS: { value: AssetType; tKey: string }[] = [
  { value: "STOCK", tKey: "type.STOCK" },
  { value: "CRYPTO", tKey: "type.CRYPTO" },
  { value: "TREASURY", tKey: "type.TREASURY" },
  { value: "CASH", tKey: "type.CASH" },
  { value: "OTHER", tKey: "type.OTHER" },
];

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

export function AssetForm({ initialValues, onSuccess, onCancel }: AssetFormProps) {
  const { t } = useSettings();
  const isEdit = !!initialValues?.id;
  const [name, setName] = useState(initialValues?.name ?? "");
  const [type, setType] = useState<AssetType>(initialValues?.type ?? "STOCK");
  const [currency, setCurrency] = useState<AppCurrency>(initialValues?.currency ?? "USD");
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

    const body: Record<string, unknown> = { name, type, currency, quantity: parseFloat(quantity) };
    if (needsTicker) body.ticker = ticker;
    if (needsManualPrice) body.manualPrice = parseFloat(manualPrice);

    const url = isEdit ? `/api/assets/${initialValues!.id}` : "/api/assets";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error ?? "Something went wrong"); return; }
      onSuccess();
    } catch {
      setError(t("form.error_network"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="asset-name">{t("form.name")}</Label>
          <Input
            id="asset-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Apple Inc."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="asset-type">{t("form.type")}</Label>
          <Select
            value={type}
            onValueChange={(v) => { setType(v as AssetType); setTicker(""); }}
          >
            <SelectTrigger id="asset-type">
              <SelectValue placeholder={t("form.select_type")} />
            </SelectTrigger>
            <SelectContent>
              {ASSET_TYPE_KEYS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {t(item.tKey as Parameters<typeof t>[0])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="asset-currency">{t("form.currency")}</Label>
          <Select value={currency} onValueChange={(v) => { if (v) setCurrency(v as AppCurrency); }}>
            <SelectTrigger id="asset-currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD — US Dollar</SelectItem>
              <SelectItem value="BRL">BRL — Real Brasileiro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {type === "CRYPTO" && (
          <div className="space-y-1.5">
            <Label htmlFor="asset-coin">{t("form.coin")}</Label>
            <Select
              value={ticker}
              onValueChange={(id) => {
                if (!id) return;
                setTicker(id);
                if (!name) {
                  const coin = CRYPTO_COINS.find((c) => c.id === id);
                  if (coin) setName(coin.label.split(" (")[0]);
                }
              }}
            >
              <SelectTrigger id="asset-coin">
                <SelectValue placeholder={t("form.select_coin")} />
              </SelectTrigger>
              <SelectContent>
                {CRYPTO_COINS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t("form.coingecko_hint")}</p>
          </div>
        )}

        {type === "STOCK" && (
          <div className="space-y-1.5">
            <Label htmlFor="asset-ticker">{t("form.ticker")}</Label>
            <Input
              id="asset-ticker"
              required
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="e.g. AAPL"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="asset-quantity">{t("form.quantity")}</Label>
          <Input
            id="asset-quantity"
            required
            type="number"
            min="0"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 10"
          />
        </div>

        {needsManualPrice && (
          <div className="space-y-1.5">
            <Label htmlFor="asset-price">{t("form.value")}</Label>
            <Input
              id="asset-price"
              required
              type="number"
              min="0"
              step="any"
              value={manualPrice}
              onChange={(e) => setManualPrice(e.target.value)}
              placeholder="e.g. 1000.00"
            />
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={loading} size="sm">
          {loading ? t("form.saving") : isEdit ? t("form.save") : t("form.add_asset")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          {t("form.cancel")}
        </Button>
      </div>
    </form>
  );
}
