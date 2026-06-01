"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/use-settings";

export function SnapshotButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useSettings();

  async function handleClick() {
    setLoading(true);
    try {
      await fetch("/api/networth/snapshot", { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={loading}>
      {loading ? t("dashboard.saving") : t("dashboard.take_snapshot")}
    </Button>
  );
}
