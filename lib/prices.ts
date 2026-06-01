import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { Asset } from "@prisma/client";

const logger = createLogger("lib/prices");

export async function fetchUsdBrlRate(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=BRL",
      { next: { revalidate: 3600 } } // cache for 1 hour — ECB rates update once daily
    );
    if (!res.ok) {
      logger.warn("Frankfurter API non-OK response", { status: res.status });
      return null;
    }
    const data = await res.json();
    const rate = data?.rates?.BRL;
    if (typeof rate !== "number") {
      logger.warn("Frankfurter API unexpected shape", { data });
      return null;
    }
    return rate;
  } catch (err) {
    logger.error("Frankfurter API fetch failed", { err });
    return null;
  }
}

export async function fetchStockPrice(ticker: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 0 } }
    );
    if (!res.ok) {
      logger.warn("Yahoo Finance non-OK response", { ticker, status: res.status });
      return null;
    }
    const data = await res.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (typeof price !== "number") {
      logger.warn("Yahoo Finance unexpected response shape", { ticker });
      return null;
    }
    return price;
  } catch (err) {
    logger.error("Yahoo Finance fetch failed", { ticker, err });
    return null;
  }
}

export async function fetchCryptoPrices(
  ids: string[]
): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  try {
    const joined = ids.map(encodeURIComponent).join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${joined}&vs_currencies=usd`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) {
      logger.warn("CoinGecko non-OK response", { ids, status: res.status });
      return {};
    }
    const data: Record<string, { usd?: number }> = await res.json();
    const result: Record<string, number> = {};
    for (const id of ids) {
      const price = data[id]?.usd;
      if (typeof price === "number") result[id] = price;
    }
    return result;
  } catch (err) {
    logger.error("CoinGecko fetch failed", { ids, err });
    return {};
  }
}

type AssetStub = Pick<Asset, "id" | "type" | "ticker">;

export async function refreshAllPrices(): Promise<{
  updated: number;
  failed: string[];
}> {
  const assets = await prisma.asset.findMany({
    where: { ticker: { not: null }, type: { in: ["STOCK", "CRYPTO"] } },
    select: { id: true, type: true, ticker: true },
  });

  if (assets.length === 0) return { updated: 0, failed: [] };

  const stocks = assets.filter((a: AssetStub) => a.type === "STOCK");
  const cryptos = assets.filter((a: AssetStub) => a.type === "CRYPTO");

  const stockResults = await Promise.allSettled(
    stocks.map((a: AssetStub) => fetchStockPrice(a.ticker!))
  );

  const cryptoIds = cryptos.map((a: AssetStub) => a.ticker!);
  const cryptoPriceMap = await fetchCryptoPrices(cryptoIds);

  const now = new Date();
  const failed: string[] = [];
  let updated = 0;
  const updates: Promise<unknown>[] = [];

  stocks.forEach((asset: AssetStub, i: number) => {
    const result = stockResults[i];
    const price = result.status === "fulfilled" ? result.value : null;
    if (price === null) {
      failed.push(asset.ticker!);
      return;
    }
    updates.push(
      prisma.asset.update({
        where: { id: asset.id },
        data: { cachedPrice: price, priceFetchedAt: now },
      })
    );
    updated++;
  });

  cryptos.forEach((asset: AssetStub) => {
    const price = cryptoPriceMap[asset.ticker!];
    if (price === undefined) {
      failed.push(asset.ticker!);
      return;
    }
    updates.push(
      prisma.asset.update({
        where: { id: asset.id },
        data: { cachedPrice: price, priceFetchedAt: now },
      })
    );
    updated++;
  });

  await Promise.all(updates);

  logger.info("Prices refreshed", { updated, failed });
  return { updated, failed };
}
