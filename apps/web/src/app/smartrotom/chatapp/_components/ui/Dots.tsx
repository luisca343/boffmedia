import { cn } from "@/lib/utils";

/** Bouncing typing indicator dots (inherits `currentColor`). */
export function Dots({ sm, className }: { sm?: boolean; className?: string }) {
  const dot = cn("inline-block rounded-full bg-current animate-ca-bounce motion-reduce:animate-none", sm ? "h-1 w-1" : "h-[0.3125rem] w-[0.3125rem]");
  return (
    <span className={cn("inline-flex gap-[3px]", className)}>
      <i className={dot} />
      <i className={dot} style={{ animationDelay: ".16s" }} />
      <i className={dot} style={{ animationDelay: ".32s" }} />
    </span>
  );
}
