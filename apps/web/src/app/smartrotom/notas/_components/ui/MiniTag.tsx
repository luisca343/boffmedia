import type { MouseEvent } from "react";
import { Icon } from "./Icon";
import { rgbOf } from "../../_utils/colors";

// Tag pill: ink at full over the same hue at ~14% — one pattern for list, header,
// picker. Data-driven hue → inline style (Tailwind can't express arbitrary tints).
export function MiniTag({
  label,
  color,
  onClick,
  removable,
  onRemove,
}: {
  label: string;
  color: string;
  onClick?: (e: MouseEvent) => void;
  removable?: boolean;
  onRemove?: () => void;
}) {
  const rgb = rgbOf(color);
  return (
    <span
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full px-[7px] py-px text-[10.5px] font-[550] leading-normal"
      style={{
        background: `rgb(${rgb} / .14)`,
        color: `rgb(${rgb})`,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <span className="opacity-70">#</span>
      {label}
      {removable && (
        <span
          className="ml-0.5 inline-flex cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
        >
          <Icon name="x" size={11} />
        </span>
      )}
    </span>
  );
}
