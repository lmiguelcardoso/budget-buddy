import { ok } from "@/lib/response";

export function GET() {
  return ok({ status: "ok", version: "0.1.0", service: "budgetly" });
}
