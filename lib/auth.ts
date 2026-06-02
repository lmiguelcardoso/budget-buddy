import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { AccountStatus, User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";
import { forbidden, unauthorized } from "@/lib/response";

const SESSION_DAYS = 30;
const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;
const PASSWORD_SALT_ROUNDS = 12;

type SafeUser = Pick<User, "id" | "email" | "name" | "status" | "emailVerifiedAt">;

export class AuthError extends Error {
  status: 401 | 403;

  constructor(status: 401 | 403, message: string) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getSessionExpiry(): Date {
  return new Date(Date.now() + SESSION_MAX_AGE * 1000);
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = getSessionExpiry();

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function destroySession(token?: string | null) {
  if (!token) return;
  await prisma.session.deleteMany({
    where: { tokenHash: hashSessionToken(token) },
  });
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          emailVerifiedAt: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  return session.user;
}

export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError(401, "Authentication required");
  return user;
}

export async function requireActiveUser(): Promise<SafeUser> {
  const user = await requireUser();
  if (user.status !== "ACTIVE") {
    throw new AuthError(403, statusMessage(user.status));
  }
  return user;
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return error.status === 401 ? unauthorized(error.message) : forbidden(error.message);
  }
  return null;
}

function statusMessage(status: AccountStatus): string {
  if (status === "PENDING_EMAIL_CONFIRMATION") {
    return "Please confirm your email before signing in.";
  }
  if (status === "SUSPENDED") {
    return "This account is suspended.";
  }
  return "Account is not active.";
}
