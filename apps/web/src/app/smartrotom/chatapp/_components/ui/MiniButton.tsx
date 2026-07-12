import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  accent?: boolean;
  /** Grow to fill the row (default). Set false for auto width. */
  grow?: boolean;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

/** Compact card action button (waypoint/document/media/info panels). */
export function MiniButton({ accent, grow = true, className, type = "button", children, ...rest }: Props) {
  return (
    <button
      type={type}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-ca-md p-2 text-[12.5px] font-semibold transition-colors duration-[120ms]",
        grow && "flex-1",
        accent
          ? "bg-ca-accent text-ca-on-accent hover:brightness-[1.06]"
          : "bg-ca-500/[.14] text-ca-100 hover:bg-ca-500/[.24]",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
