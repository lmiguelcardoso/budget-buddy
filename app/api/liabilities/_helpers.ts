import { z } from "zod";
import { Prisma } from "@prisma/client";

export function serializeLiability(liability: Prisma.LiabilityGetPayload<object>) {
  return {
    ...liability,
    amount: liability.amount.toString(),
  };
}

export const createLiabilitySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["MORTGAGE", "CREDIT_CARD", "STUDENT_LOAN", "OTHER"]),
  currency: z.enum(["USD", "BRL"]),
  amount: z.number().positive(),
});

export const updateLiabilitySchema = z
  .object({
    name: z.string().min(1).optional(),
    type: z.enum(["MORTGAGE", "CREDIT_CARD", "STUDENT_LOAN", "OTHER"]).optional(),
    currency: z.enum(["USD", "BRL"]).optional(),
    amount: z.number().positive().optional(),
  })
  .strict();
