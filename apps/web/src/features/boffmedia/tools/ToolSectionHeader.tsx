import { ReactNode } from "react";

interface ToolSectionHeaderProps {
  icon?: ReactNode;
  label: string;
  /**
   * Tailwind color token for the accent line and text.
   * Use `"neutral"` for generic / un-accented section labels.
   * Defaults to `"secondary"`.
   */
  color?: "primary" | "secondary" | "accent" | "neutral";
}

const COLOR_MAP = {
  primary: {
    text: "text-primary-400/70",
    line: "from-primary-500/40",
  },
  secondary: {
    text: "text-secondary-400/70",
    line: "from-secondary-500/40",
  },
  accent: {
    text: "text-accent-400/70",
    line: "from-accent-500/40",
  },
  neutral: {
    text: "text-surface-500",
    line: "from-surface-700/50",
  },
};

export function ToolSectionHeader({ icon, label, color = "secondary" }: ToolSectionHeaderProps) {
  const cfg = COLOR_MAP[color];

  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex items-center gap-2">
        {icon && (
          <span className={`${cfg.text} [&_svg]:w-4 [&_svg]:h-4`}>{icon}</span>
        )}
        <span
          className={`text-xs font-mono ${cfg.text} tracking-[0.35em] uppercase`}
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          // {label}
        </span>
      </div>
      <div className={`h-px flex-1 bg-gradient-to-r ${cfg.line} to-transparent`} />
    </div>
  );
}
