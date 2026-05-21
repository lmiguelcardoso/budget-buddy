"use client";

import { ThemeProvider } from "next-themes";
import { SettingsProvider } from "@/contexts/settings-context";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SettingsProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
