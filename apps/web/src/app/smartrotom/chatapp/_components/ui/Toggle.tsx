import { cn } from "@/lib/utils";

/** iOS-style on/off switch. */
export function Toggle({ on, onClick, className }: { on: boolean; onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "flex-none rounded-full p-0.5 transition-colors duration-200",
        on ? "bg-ca-accent" : "bg-ca-600",
        className,
      )}
      style={{ width: 42, height: 24 }}
    >
      <span
        className="block h-5 w-5 rounded-full bg-white transition-transform duration-200"
        style={{ transform: on ? "translateX(18px)" : "none" }}
      />
    </button>
  );
}
