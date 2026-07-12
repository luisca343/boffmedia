import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

type Props = {
  icon: IconName;
  iconSize?: number;
  active?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

/** Round 40×40 icon-only control. Pass a size override via `className` (e.g. `h-8 w-8`). */
export function IconButton({ icon, iconSize = 19, active, className, type = "button", title, ...rest }: Props) {
  return (
    <button
      type={type}
      title={title}
      aria-label={title}
      className={cn(
        "grid h-10 w-10 flex-none place-items-center rounded-full transition-[background-color,color,transform] duration-[120ms] active:scale-[.92]",
        active ? "bg-ca-accent/[.14] text-ca-accent-soft" : "text-ca-300 hover:bg-ca-500/[.16] hover:text-ca-100",
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
}
