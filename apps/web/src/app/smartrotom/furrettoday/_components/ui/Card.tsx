import { cn } from "@/lib/utils";

/**
 * The magazine card. `lift` is the hover behaviour every clickable card shares:
 * the slab slides up-left and its ink shadow deepens.
 *
 * Classes merge through `cn` (tailwind-merge) rather than string concatenation,
 * so a caller passing `bg-ft-pink` actually replaces the default `bg-white`.
 * Concatenated, the two would be same-specificity utilities and the winner would
 * depend on their order in the compiled stylesheet, not on the call site.
 */
export function Card({
  lift = false,
  className,
  children,
  style,
}: {
  lift?: boolean;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "border-ft rounded-ft-lg border-ft-ink bg-white shadow-ft-pop",
        "transition-[transform,box-shadow] duration-200 ease-ft",
        lift &&
          "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-ft-pop-lg motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}

/** The quieter sibling: tighter radius, no shadow. Sidebar widgets, panels. */
export function CardFlat({
  className,
  children,
  style,
}: {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn("border-ft rounded-ft border-ft-ink bg-white", className)}
      style={style}
    >
      {children}
    </div>
  );
}
