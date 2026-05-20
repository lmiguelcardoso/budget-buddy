"use client";

import { Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { LANGUAGES } from "@/lib/i18n";
import { useSettings } from "@/hooks/use-settings";
import type { Language } from "@/lib/i18n";

export function SettingsModal() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { settings, setLanguage, t } = useSettings();

  return (
    <>
      <Button variant="ghost" size="icon" aria-label={t("nav.settings")} onClick={() => setOpen(true)}>
        <Settings className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("settings.title")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                {t("settings.appearance")}
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode-switch">{t("settings.dark_mode")}</Label>
                <Switch
                  id="dark-mode-switch"
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {t("settings.language")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("settings.language_desc")}
                </p>
              </div>
              <Select
                value={settings.language}
                onValueChange={(v) => { if (v) setLanguage(v as Language); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
