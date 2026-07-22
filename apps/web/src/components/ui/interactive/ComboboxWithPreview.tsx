"use client";

import { useTranslations } from "next-intl";
import { Combobox } from "@/components/ui/primitives/combobox";

interface ComboboxWithPreviewProps {
  value: string;
  onChange: (value: string) => void;
  data: { label: string; value: string }[];
  placeholder?: string;
  preview?: string;
  previewAlt?: string;
  variant?: "default" | "orange" | "wingull" | "boff";
  disabled?: boolean;
  className?: string;
  previewSize?: number;
  fallbackText?: string;
}

const PREVIEW_FRAME: Record<"default" | "orange" | "wingull" | "boff", React.CSSProperties> = {
  default: { background: "rgba(51,65,85,0.6)", border: "1px solid rgba(71,85,105,0.5)" },
  orange:  { background: "rgba(51,65,85,0.6)", border: "1px solid rgba(249,115,22,0.4)" },
  wingull: { background: "rgba(8,47,73,0.6)",  border: "1px solid rgba(6,182,212,0.4)" },
  boff:    { background: "rgba(30,41,59,0.8)",  border: "1px solid rgba(100,116,139,0.5)" },
};

const FALLBACK_TEXT_STYLE: Record<"default" | "orange" | "wingull" | "boff", React.CSSProperties> = {
  default: { color: "rgba(148,163,184,0.5)", fontFamily: "monospace" },
  orange:  { color: "rgba(249,115,22,0.5)",  fontFamily: "monospace" },
  wingull: { color: "rgba(6,182,212,0.5)",   fontFamily: "monospace" },
  boff:    { color: "rgba(34,211,238,0.35)",  fontFamily: "Orbitron, monospace", fontSize: "11px" },
};

export function ComboboxWithPreview({
  value,
  onChange,
  data,
  placeholder,
  preview,
  previewAlt,
  variant = "default",
  disabled = false,
  className,
  previewSize = 40,
  fallbackText = "?",
}: ComboboxWithPreviewProps) {
  const t = useTranslations("boffmedia");
  const resolvedPlaceholder = placeholder ?? t("ui.comboboxPlaceholder");
  const resolvedPreviewAlt = previewAlt ?? t("ui.comboboxPreviewAlt");
  const isNothingSelected = value === "0" || !preview;
  const frameSize = previewSize + 8;

  return (
    <div className="flex items-center gap-2">
      <Combobox
        variant={variant}
        data={data}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={resolvedPlaceholder}
        className={`flex-grow ${className || ""}`}
      />
      <div
        className="flex items-center justify-center rounded flex-shrink-0 transition-all duration-200"
        style={{ width: frameSize, height: frameSize, ...PREVIEW_FRAME[variant] }}
      >
        {!isNothingSelected && preview ? (
          <img
            width={previewSize}
            height={previewSize}
            src={preview}
            alt={resolvedPreviewAlt}
            style={{ imageRendering: "pixelated" }}
          />
        ) : (
          <span style={FALLBACK_TEXT_STYLE[variant]}>{fallbackText}</span>
        )}
      </div>
    </div>
  );
}