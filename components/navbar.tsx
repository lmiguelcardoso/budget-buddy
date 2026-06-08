"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/settings-modal";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const { t } = useSettings();
  const [user, setUser] = useState<{ email: string; name: string | null } | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      setUser(json.success ? json.data.user : null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      fetchUser();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [fetchUser, pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/login";
  }

  const links = [
    { href: "/", label: t("nav.dashboard") },
    { href: "/assets", label: t("nav.assets") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-bold tracking-tight">
            Budget Buddy
          </Link>
          <nav className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                  pathname === link.href
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          {user && (
            <span className="hidden max-w-40 truncate px-2 text-xs text-muted-foreground sm:inline">
              {user.name || user.email}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("settings.toggle_theme")}
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <SettingsModal />
          {user && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("auth.logout")}
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
