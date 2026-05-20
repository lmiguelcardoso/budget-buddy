"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/hooks/use-settings";

type LiabilityType = "MORTGAGE" | "CREDIT_CARD" | "STUDENT_LOAN" | "OTHER";

interface LiabilityFormProps {
  initialValues?: {
    id?: string;
    name: string;
    type: LiabilityType;
    amount: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const LIABILITY_TYPE_KEYS: { value: LiabilityType; tKey: string }[] = [
  { value: "MORTGAGE", tKey: "type.MORTGAGE" },
  { value: "CREDIT_CARD", tKey: "type.CREDIT_CARD" },
  { value: "STUDENT_LOAN", tKey: "type.STUDENT_LOAN" },
  { value: "OTHER", tKey: "type.OTHER" },
];

export function LiabilityForm({ initialValues, onSuccess, onCancel }: LiabilityFormProps) {
  const { t } = useSettings();
  const isEdit = !!initialValues?.id;
  const [name, setName] = useState(initialValues?.name ?? "");
  const [type, setType] = useState<LiabilityType>(initialValues?.type ?? "CREDIT_CARD");
  const [amount, setAmount] = useState(initialValues?.amount ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = isEdit ? `/api/liabilities/${initialValues!.id}` : "/api/liabilities";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, amount: parseFloat(amount) }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error ?? "Something went wrong"); return; }
      onSuccess();
    } catch {
      setError(t("form.error_network"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="liability-name">{t("form.name")}</Label>
          <Input
            id="liability-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Visa card"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="liability-type">{t("form.type")}</Label>
          <Select value={type} onValueChange={(v) => setType(v as LiabilityType)}>
            <SelectTrigger id="liability-type">
              <SelectValue placeholder={t("form.select_type")} />
            </SelectTrigger>
            <SelectContent>
              {LIABILITY_TYPE_KEYS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {t(item.tKey as Parameters<typeof t>[0])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="liability-amount">{t("liabilities.col.amount")} (USD)</Label>
          <Input
            id="liability-amount"
            required
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 5000.00"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={loading} size="sm">
          {loading ? t("form.saving") : isEdit ? t("form.save") : t("form.add_liability")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          {t("form.cancel")}
        </Button>
      </div>
    </form>
  );
}
