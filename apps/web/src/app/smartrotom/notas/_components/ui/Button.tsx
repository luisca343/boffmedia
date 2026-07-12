import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost";

const BASE =
  "inline-flex h-9 items-center justify-center gap-2 rounded-nt-md px-3.5 text-[13.5px] font-[550] transition-all disabled:opacity-50 disabled:pointer-events-none";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-nt-500 to-nt-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/.12),0_6px_16px_-8px_rgb(234_88_12/.8)] hover:brightness-[1.06] active:brightness-95",
  ghost:
    "border border-nt-border bg-nt-hover text-nt-fg-muted hover:bg-nt-hover-strong hover:text-nt-fg",
};

export function Button({
  variant = "ghost",
  className = "",
  children,
  ...rest
}: {
  variant?: Variant;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${BASE} ${VARIANT[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

// Square/rectangular chrome icon button (topnav, headers, toolbars).
export function IconButton({
  active,
  className = "",
  children,
  ...rest
}: {
  active?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-nt-sm border border-transparent px-[7px] text-[13px] transition-all ${
        active
          ? "bg-nt-accent/15 text-nt-accent-fg"
          : "text-nt-fg-muted hover:bg-nt-hover-strong hover:text-nt-fg"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
