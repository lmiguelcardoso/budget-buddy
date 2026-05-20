import { ok, serverError } from "@/lib/response";
import { createLogger } from "@/lib/logger";
import { refreshAllPrices } from "@/lib/prices";

const logger = createLogger("api/assets/refresh-prices");

export async function POST() {
  try {
    const result = await refreshAllPrices();
    logger.info("Prices refreshed", result);
    return ok(result);
  } catch (err) {
    logger.error("Failed to refresh prices", { err });
    return serverError();
  }
}
