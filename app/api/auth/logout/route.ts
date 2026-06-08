import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";
import { clearSessionCookie, destroySession } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  await destroySession(token);

  const response = NextResponse.json({
    success: true,
    message: "Logged out",
    data: null,
    error: null,
  });
  clearSessionCookie(response);
  return response;
}
