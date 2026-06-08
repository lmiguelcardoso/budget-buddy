import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/response";
import { createLogger } from "@/lib/logger";
import { authErrorResponse, requireActiveUser } from "@/lib/auth";
import { serializeLiability, createLiabilitySchema } from "./_helpers";

const logger = createLogger("api/liabilities");

export async function GET() {
  try {
    const user = await requireActiveUser();
    const liabilities = await prisma.liability.findMany({
      where: { userId: user.id },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
    logger.info("Liabilities fetched", { count: liabilities.length });
    return ok(liabilities.map(serializeLiability));
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;
    logger.error("Failed to fetch liabilities", { err });
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireActiveUser();
    const body = await req.json();
    const parsed = createLiabilitySchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }
    const liability = await prisma.liability.create({
      data: { ...parsed.data, userId: user.id },
    });
    logger.info("Liability created", { id: liability.id });
    return ok(serializeLiability(liability));
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;
    logger.error("Failed to create liability", { err });
    return serverError();
  }
}
