import { ok } from "@/lib/response";
import { authErrorResponse, requireActiveUser } from "@/lib/auth";
import { serializeUser } from "../_helpers";

export async function GET() {
  try {
    const user = await requireActiveUser();
    return ok({ user: serializeUser(user) });
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;
    throw err;
  }
}
