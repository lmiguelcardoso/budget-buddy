import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterClient } from "./register-client";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user?.status === "ACTIVE") redirect("/");

  return <RegisterClient />;
}
