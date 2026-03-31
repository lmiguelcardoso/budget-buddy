import { ok } from "@/lib/response";
import { createLogger } from "@/lib/logger";

const logger = createLogger("api/health");

export function GET() {
  logger.info("GET /api/health — request received");
  return ok({ status: "ok", version: "0.1.0", service: "budgetly" });
}
