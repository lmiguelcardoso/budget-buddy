"use client";

import { Settings, Eye, EyeOff, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
import { LANGUAGES } from "@/lib/i18n";
import { useSettings } from "@/hooks/use-settings";
import type { Language } from "@/lib/i18n";
import type { AiProvider } from "@/lib/ai";

const AI_PROVIDERS: { value: AiProvider; label: string }[] = [
  { value: "OPENAI",    label: "OpenAI" },
  { value: "GEMINI",    label: "Google Gemini" },
  { value: "ANTHROPIC", label: "Anthropic Claude" },
];

export function SettingsModal() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { settings, setLanguage, t } = useSettings();

  const [maskedKey, setMaskedKey]     = useState<string | null>(null);
  const [provider, setProvider]       = useState<AiProvider>("OPENAI");
  const [keyInput, setKeyInput]       = useState("");
  const [showKey, setShowKey]         = useState(false);
  const [keySaving, setKeySaving]     = useState(false);
  const [keyRemoving, setKeyRemoving] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/user/api-key")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data.hasKey) {
          setMaskedKey(d.data.maskedKey);
          if (d.data.provider) setProvider(d.data.provider as AiProvider);
        }
      })
      .catch(() => undefined);
  }, [open]);

  async function saveKey() {
    if (!keyInput.trim()) return;
    setKeySaving(true);
    try {
      const res = await fetch("/api/user/api-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key: keyInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setMaskedKey(data.data.maskedKey);
        setKeyInput("");
      }
    } finally {
      setKeySaving(false);
    }
  }

  async function removeKey() {
    setKeyRemoving(true);
    try {
      await fetch("/api/user/api-key", { method: "DELETE" });
      setMaskedKey(null);
      setKeyInput("");
    } finally {
      setKeyRemoving(false);
    }
  }

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
            {/* Appearance */}
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

            {/* Language */}
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

            <Separator />

            {/* AI Assistant */}
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {t("settings.ai_key")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("settings.ai_key_desc")}
                </p>
              </div>

              {/* Saved key display */}
              {maskedKey && (
                <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="text-xs text-muted-foreground">
                    {AI_PROVIDERS.find((p) => p.value === provider)?.label}
                  </span>
                  <span className="font-mono text-muted-foreground">{maskedKey}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={removeKey}
                    disabled={keyRemoving}
                    aria-label={t("settings.ai_key_remove")}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              )}

              {/* Provider selector */}
              <div className="space-y-1.5">
                <Label>{t("settings.ai_provider")}</Label>
                <Select
                  value={provider}
                  onValueChange={(v) => setProvider(v as AiProvider)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Key input */}
              <div className="space-y-1.5">
                <Label htmlFor="api-key-input">{t("settings.ai_key_label")}</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="api-key-input"
                      type={showKey ? "text" : "password"}
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder={t("settings.ai_key_placeholder")}
                      className="pr-9 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button
                    onClick={saveKey}
                    disabled={keySaving || !keyInput.trim()}
                    size="sm"
                  >
                    {keySaving ? t("settings.ai_key_saving") : t("settings.ai_key_save")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
