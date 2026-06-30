"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

const STORAGE_KEY = "schematic-compat:guide-dismissed";

export function OnboardingGuide() {
  const t = useTranslations("games.minecraft.schematicCompat.guide");
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Avoid SSR mismatch — read localStorage only on the client
  useEffect(() => {
    setMounted(true);
    const dismissed = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
    setExpanded(!dismissed);
  }, []);

  if (!mounted) return null;

  function dismiss() {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, "1");
    setExpanded(false);
  }

  return (
    <div className="rounded-md border border-edge/50 bg-layer-2/40 text-xs">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-ink-muted hover:text-ink"
      >
        <Info className="h-3.5 w-3.5 shrink-0 text-accent" />
        <span className="flex-1 font-medium">{t("title")}</span>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-edge/40 px-3 pb-3 pt-2 space-y-1.5">
          <ol className="space-y-1.5 text-ink-dim">
            {(["step1", "step2", "step3", "step4", "step5"] as const).map((key, i) => (
              <li key={key} className="flex gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-[10px] font-bold text-accent">
                  {i + 1}
                </span>
                <span>{t(key)}</span>
              </li>
            ))}
          </ol>
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={dismiss}
              className="text-[10px] text-ink-dim hover:text-ink-muted underline underline-offset-2"
            >
              {t("dismiss")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
