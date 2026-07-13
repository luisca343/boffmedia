import { forwardRef } from "react";

type Variant = "default" | "primary" | "ink" | "cyan" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  default: "bg-ft-yellow text-ft-ink shadow-ft-pop-sm",
  primary: "bg-ft-pink text-white shadow-ft-pop-sm",
  ink: "bg-ft-ink text-ft-yellow shadow-ft-pop-sm",
  cyan: "bg-ft-cyan text-ft-ink shadow-ft-pop-sm",
  ghost: "bg-transparent text-ft-ink shadow-none hover:bg-ft-ink/5",
};

const SIZE: Record<Size, string> = {
  sm: "px-3.5 py-2 text-xs",
  md: "px-5 py-3 text-sm",
  lg: "px-7 py-4 text-base",
};

/**
 * The press-print button: ink outline, hard offset shadow, and on hover the
 * whole slab shifts up-left so the shadow grows — as if you were lifting it off
 * the page. `ghost` opts out of the lift entirely (it has no shadow to grow).
 */
export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
  }
>(function Button(
  { variant = "default", size = "md", className, children, ...props },
  ref,
) {
  const lift =
    variant === "ghost"
      ? ""
      : "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-ft-pop-md active:translate-x-px active:translate-y-px active:shadow-ft-pop-xs";

  return (
    <button
      ref={ref}
      className={[
        "font-ft-ui border-ft inline-flex items-center justify-center gap-2 whitespace-nowrap",
        "rounded-ft-pill border-ft-ink font-extrabold uppercase tracking-[0.06em]",
        "transition-[transform,box-shadow,background-color] duration-150",
        "disabled:pointer-events-none disabled:opacity-55",
        "motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0",
        VARIANT[variant],
        SIZE[size],
        lift,
        className ?? "",
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
});
