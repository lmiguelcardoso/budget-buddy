import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { badRequest, ok, serverError } from "@/lib/response";
import { createLogger } from "@/lib/logger";
import { hashPassword, normalizeEmail } from "@/lib/auth";
import { registerSchema, serializeUser } from "../_helpers";

const logger = createLogger("api/auth/register");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const email = normalizeEmail(parsed.data.email);
    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        passwordHash: await hashPassword(parsed.data.password),
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        emailVerifiedAt: true,
      },
    });

    logger.info("User registered pending activation", { id: user.id });
    return ok(
      { user: serializeUser(user) },
      "Registration successful. Your account is pending email confirmation."
    );
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return badRequest("An account with this email already exists.");
    }

    logger.error("Failed to register user", { err });
    return serverError();
  }
}
