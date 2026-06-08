import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { LoginClient } from "./login-client";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user?.status === "ACTIVE") redirect("/");

  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  );
}
