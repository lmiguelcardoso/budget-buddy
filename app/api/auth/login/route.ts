import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, forbidden, serverError, unauthorized } from "@/lib/response";
import { createLogger } from "@/lib/logger";
import {
  createSession,
  normalizeEmail,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { loginSchema, serializeUser } from "../_helpers";

const logger = createLogger("api/auth/login");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(parsed.data.email) },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        emailVerifiedAt: true,
        passwordHash: true,
      },
    });

    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return unauthorized("Invalid email or password.");
    }

    if (user.status !== "ACTIVE") {
      return forbidden(
        user.status === "PENDING_EMAIL_CONFIRMATION"
          ? "Please confirm your email before signing in."
          : "This account is not active."
      );
    }

    const { token, expiresAt } = await createSession(user.id);
    const response = NextResponse.json({
      success: true,
      message: "Logged in",
      data: { user: serializeUser(user) },
      error: null,
    });
    setSessionCookie(response, token, expiresAt);

    logger.info("User logged in", { id: user.id });
    return response;
  } catch (err) {
    logger.error("Failed to log in user", { err });
    return serverError();
  }
}
