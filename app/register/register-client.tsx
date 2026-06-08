"use client";

import Link from "next/link";
import { CheckCircle2, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";

export function RegisterClient() {
  const { t } = useSettings();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, email, password }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? t("auth.register_failed"));
        return;
      }
      setRegistered(true);
    } catch {
      setError(t("form.error_network"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">{t("auth.register_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {registered ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-md border bg-muted px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{t("auth.pending_title")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("auth.pending_description")}
                  </p>
                </div>
              </div>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "justify-center")}
              >
                {t("auth.back_to_login")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="register-name">{t("auth.name")}</Label>
                <Input
                  id="register-name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="register-email">{t("auth.email")}</Label>
                <Input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="register-password">{t("auth.password")}</Label>
                <Input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t("auth.password_hint")}</p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" disabled={loading} size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  {loading ? t("auth.creating_account") : t("auth.register")}
                </Button>
                <Link
                  href="/login"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "justify-center")}
                >
                  {t("auth.back_to_login")}
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
