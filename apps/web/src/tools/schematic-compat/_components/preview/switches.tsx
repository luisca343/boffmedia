"use client";

import { useTranslations } from "next-intl";
import { SwitchGroup, SwitchSegment } from "@/components/boffmedia/ui/schematic";
import type { PreviewMode } from "../../_store/tool.store";

/** Source / Result / Diff. Conversion-only — the last two need a diff. */
export function ModeSwitch({
  mode,
  convertedEnabled,
  onChange,
}: {
  mode: PreviewMode;
  convertedEnabled: boolean;
  onChange: (m: PreviewMode) => void;
}) {
  const t = useTranslations("games.minecraft.schematicCompat");
  const segment = (value: PreviewMode, label: string, disabled?: boolean) => (
    <SwitchSegment
      active={mode === value}
      disabled={disabled}
      title={disabled ? t("preview.modeDisabled") : undefined}
      onClick={() => onChange(value)}
    >
      {label}
    </SwitchSegment>
  );
  return (
    <SwitchGroup>
      {segment("source", t("preview.modeSource"))}
      {segment("result", t("preview.modeResult"), !convertedEnabled)}
      {segment("converted", t("preview.modeDiff"), !convertedEnabled)}
    </SwitchGroup>
  );
}
