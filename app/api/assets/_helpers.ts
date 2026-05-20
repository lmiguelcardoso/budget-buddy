import { z } from "zod";
import { Prisma } from "@prisma/client";

export function serializeAsset(asset: Prisma.AssetGetPayload<object>) {
  const price = asset.cachedPrice ?? asset.manualPrice;
  return {
    ...asset,
    quantity: asset.quantity.toString(),
    manualPrice: asset.manualPrice?.toString() ?? null,
    cachedPrice: asset.cachedPrice?.toString() ?? null,
    currentValue: price ? asset.quantity.times(price).toFixed(2) : "0.00",
  };
}

export const createAssetSchema = z
  .object({
    name: z.string().min(1),
    type: z.enum(["STOCK", "CRYPTO", "TREASURY", "CASH", "OTHER"]),
    currency: z.enum(["USD", "BRL"]),
    ticker: z.string().min(1).optional(),
    quantity: z.number().positive(),
    manualPrice: z.number().positive().optional(),
  })
  .superRefine((val, ctx) => {
    if ((val.type === "STOCK" || val.type === "CRYPTO") && !val.ticker) {
      ctx.addIssue({
        code: "custom",
        message: "ticker is required for STOCK and CRYPTO assets",
        path: ["ticker"],
      });
    }
    if (
      (val.type === "TREASURY" || val.type === "CASH" || val.type === "OTHER") &&
      val.manualPrice === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        message: "manualPrice is required for TREASURY, CASH, and OTHER assets",
        path: ["manualPrice"],
      });
    }
  });

export const updateAssetSchema = z
  .object({
    name: z.string().min(1).optional(),
    type: z.enum(["STOCK", "CRYPTO", "TREASURY", "CASH", "OTHER"]).optional(),
    currency: z.enum(["USD", "BRL"]).optional(),
    ticker: z.string().min(1).nullable().optional(),
    quantity: z.number().positive().optional(),
    manualPrice: z.number().positive().nullable().optional(),
  })
  .strict();
