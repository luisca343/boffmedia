import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  active?: boolean;
  badge?: ReactNode;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

/** Pill filter chip (category tabs, search/media filters). */
export function Chip({ active, badge, className, type = "button", children, ...rest }: Props) {
  return (
    <button
      type={type}
      className={cn(
        "flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full border border-transparent px-[0.8125rem] py-1.5 text-[0.84375rem] transition-all duration-[120ms]",
        active
          ? "bg-ca-accent/[.14] font-semibold text-ca-accent-soft"
          : "bg-ca-800 font-medium text-ca-400 hover:bg-ca-700/70",
        className,
      )}
      {...rest}
    >
      {children}
      {badge != null && (
        <span className="rounded-full bg-ca-accent px-[0.3125rem] text-[0.65625rem] font-bold text-ca-on-accent">{badge}</span>
      )}
    </button>
  );
}
