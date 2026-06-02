import { ok, serverError } from "@/lib/response";
import { createLogger } from "@/lib/logger";
import { refreshAllPrices } from "@/lib/prices";
import { authErrorResponse, requireActiveUser } from "@/lib/auth";

const logger = createLogger("api/assets/refresh-prices");

export async function POST() {
  try {
    const user = await requireActiveUser();
    const result = await refreshAllPrices(user.id);
    logger.info("Prices refreshed", result);
    return ok(result);
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;
    logger.error("Failed to refresh prices", { err });
    return serverError();
  }
}
