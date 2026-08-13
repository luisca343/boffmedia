"use client";

import { useToolT } from "../../../i18n";
import { SwitchGroup, SwitchSegment } from "../../../ui";
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
  const t = useToolT("tools.schematicCompat");
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
