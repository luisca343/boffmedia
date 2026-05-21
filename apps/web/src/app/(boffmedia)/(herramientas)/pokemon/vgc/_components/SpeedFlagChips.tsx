"use client";

export interface SpeedFlagChip {
  key: string;
  label: string;
  title?: string;
  active: boolean;
  activeClass: string;
}

interface Props {
  chips: SpeedFlagChip[];
  onToggle: (key: string) => void;
  className?: string;
  inactiveClassName?: string;
  buttonClassName?: string;
}

const DEFAULT_INACTIVE =
  "bg-surface-800/80 text-surface-400 border-transparent hover:text-surface-200 hover:bg-surface-700/60";

export function SpeedFlagChips({
  chips,
  onToggle,
  className,
  inactiveClassName = DEFAULT_INACTIVE,
  buttonClassName = "px-2.5 py-0.5 rounded text-xs font-semibold transition-all border",
}: Props) {
  if (chips.length === 0) return null;

  return (
    <div className={className ?? "flex items-center gap-1"}>
      {chips.map(({ key, label, title, active, activeClass }) => (
        <button
          key={key}
          onClick={() => onToggle(key)}
          title={title}
          className={`${buttonClassName} ${active ? activeClass : inactiveClassName}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
