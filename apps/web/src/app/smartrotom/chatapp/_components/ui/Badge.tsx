import { cn } from "@/lib/utils";

/** Accent count pill (unread counts). */
export function CountBadge({ count, className }: { count: number; className?: string }) {
  return (
    <span
      className={cn(
        "grid h-5 min-w-5 flex-none place-items-center rounded-full bg-ca-accent px-1.5 text-[11.5px] font-bold text-ca-on-accent",
        className,
      )}
    >
      {count}
    </span>
  );
}
