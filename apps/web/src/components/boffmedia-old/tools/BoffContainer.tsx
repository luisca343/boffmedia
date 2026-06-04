import { cn } from "@/lib/utils";
import { BOFF_VARIANTS, BoffVariant } from "@/components/boffmedia-old/tools/utils/boffVariants";

export type { BoffVariant };

const CORNER_CLASSES = [
  "absolute top-3 left-3 w-5 h-5 border-t border-l",
  "absolute top-3 right-3 w-5 h-5 border-t border-r",
  "absolute bottom-3 left-3 w-5 h-5 border-b border-l",
  "absolute bottom-3 right-3 w-5 h-5 border-b border-r",
] as const;

export interface BoffContainerProps {
  children: React.ReactNode;
  /** Additional classes for the outer wrapper */
  className?: string;
  /**
   * Classes applied to the inner content div (`relative z-10`).
   * Defaults to `"p-6 sm:p-8"` — pass an empty string or your own
   * padding to override.
   */
  contentClassName?: string;
  /** Boff colour theme. Defaults to `"secondary"` (cyan). */
  variant?: BoffVariant;
}

export function BoffContainer({
  children,
  className,
  contentClassName = "p-6 sm:p-8",
  variant = "secondary",
}: BoffContainerProps) {
  const boff = BOFF_VARIANTS[variant];

  return (
    <div
      className={cn(
        "relative border backdrop-blur-md rounded-lg overflow-hidden",
        className
      )}
      style={{
        background: "linear-gradient(145deg, rgba(30,41,59,0.92), rgba(15,23,42,0.95))",
        borderColor: boff.border,
        boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 60px ${boff.glow}, inset 0 1px 0 rgba(255,255,255,0.03)`,
      }}
    >
      {/* Top boff bar */}
      <div
        className={`h-[3px] bg-gradient-to-r ${boff.bar}`}
        style={{ opacity: 0.85 }}
      />

      {/* Ambient inner tint */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${boff.tint} 0%, transparent 55%)`,
        }}
      />

      {/* Corner brackets */}
      {CORNER_CLASSES.map((cls, i) => (
        <div
          key={i}
          className={`${cls} pointer-events-none`}
          style={{ borderColor: boff.bracket }}
        />
      ))}

      {/* Content */}
      <div className={cn("relative z-10", contentClassName)}>{children}</div>

      {/* Bottom accent line */}
      <div
        className="h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${boff.bottomAccent}, transparent)`,
        }}
      />
    </div>
  );
}
