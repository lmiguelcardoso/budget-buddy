"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

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

const LIABILITY_TYPES: { value: LiabilityType; label: string }[] = [
  { value: "MORTGAGE", label: "Mortgage" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "STUDENT_LOAN", label: "Student Loan" },
  { value: "OTHER", label: "Other" },
];

export function LiabilityForm({
  initialValues,
  onSuccess,
  onCancel,
}: LiabilityFormProps) {
  const isEdit = !!initialValues?.id;
  const [name, setName] = useState(initialValues?.name ?? "");
  const [type, setType] = useState<LiabilityType>(
    initialValues?.type ?? "CREDIT_CARD"
  );
  const [amount, setAmount] = useState(initialValues?.amount ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = isEdit
      ? `/api/liabilities/${initialValues!.id}`
      : "/api/liabilities";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, amount: parseFloat(amount) }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Something went wrong");
        return;
      }
      onSuccess();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4"
    >
      <h3 className="font-semibold text-gray-800">
        {isEdit ? "Edit Liability" : "Add Liability"}
      </h3>

      {error && (
        <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Visa card"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as LiabilityType)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LIABILITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Amount (USD)
          </label>
          <input
            required
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 5000.00"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading} size="sm">
          {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Liability"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
