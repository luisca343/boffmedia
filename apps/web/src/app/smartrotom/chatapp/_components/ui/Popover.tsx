import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Floating menu surface (composer menus, message actions, quick pickers).
 * Positioned by the consumer; defaults to opening upward from its anchor.
 */
export function Popover({
  children,
  className,
  style,
  onMouseLeave,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onMouseLeave?: () => void;
}) {
  return (
    <div
      onMouseLeave={onMouseLeave}
      style={style}
      className={cn(
        "absolute bottom-[calc(100%+10px)] z-30 animate-ca-pop rounded-[12px] border border-ca-800 bg-ca-panel p-1.5 shadow-ca-pop",
        className,
      )}
    >
      {children}
    </div>
  );
}

type ItemProps = { children: ReactNode } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

/** A row inside a Popover menu. */
export function PopItem({ className, type = "button", children, ...rest }: ItemProps) {
  return (
    <button
      type={type}
      className={cn(
        "flex w-full items-center gap-3 whitespace-nowrap rounded-ca-md px-3 py-[0.5625rem] text-left transition-colors duration-[120ms] hover:bg-ca-500/[.12]",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
