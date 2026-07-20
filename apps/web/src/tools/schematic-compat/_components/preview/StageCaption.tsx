"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute left-1/2 bottom-2.5 -translate-x-1/2 flex items-center gap-2.5 font-mono text-[10px] text-txt-dim whitespace-nowrap py-1 px-2.5 bg-[color-mix(in_srgb,var(--panel)_70%,transparent)] border border-line">
      {children}
    </div>
  );
}

function LegendDot({ color, label, faded }: { color?: string; label: string; faded?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", faded && "opacity-60")}>
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={color ? { background: color } : { background: "var(--dim)", opacity: 0.4 }}
      />
      {label}
    </span>
  );
}

/**
 * The strip under the stage. The diff legend and the result caption are
 * conversion-only; the selection hint is what any 3D view shows.
 */
export function StageCaption({
  convertedView,
  resultView,
  hasSelection,
}: {
  convertedView: boolean;
  resultView: boolean;
  hasSelection: boolean;
}) {
  const t = useTranslations("games.minecraft.schematicCompat");
  if (convertedView) {
    return (
      <Caption>
        <LegendDot color="var(--ok)" label={t("preview.legendModified")} />
        <LegendDot color="var(--bad)" label={t("preview.legendUnresolved")} />
        <LegendDot label={t("preview.legendUnchanged")} faded />
      </Caption>
    );
  }
  if (resultView) return <Caption>{t("preview.resultCaption")}</Caption>;
  return <Caption>{hasSelection ? t("preview.selectedHighlighted") : t("preview.clickToInspect")}</Caption>;
}
