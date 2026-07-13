import type { FtTone } from "../../_utils/accents";

/**
 * Literal classes per tone — the tone is data-driven (it comes from an
 * article's accent), so it can never be interpolated (§4).
 */
const TONE: Record<FtTone, string> = {
  ink: "bg-ft-ink text-ft-yellow",
  pink: "bg-ft-pink text-white",
  cyan: "bg-ft-cyan text-ft-ink",
  yellow: "bg-ft-yellow text-ft-ink",
  lime: "bg-ft-lime text-ft-ink",
  orange: "bg-ft-orange text-ft-ink",
  purple: "bg-ft-purple text-white",
  paper: "bg-ft-paper text-ft-ink border-ft-hair border-ft-ink",
};

/** The uppercase kicker badge that sits on top of every piece of cover art. */
export function Pill({
  tone = "ink",
  live = false,
  className,
  children,
}: {
  tone?: FtTone;
  /** Adds the pulsing dot used on anything breaking. */
  live?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={[
        "font-ft-ui inline-flex items-center gap-1.5 whitespace-nowrap",
        "rounded-ft-pill px-3 pb-[3px] pt-1 text-[11px] font-extrabold uppercase tracking-[0.14em]",
        TONE[tone],
        className ?? "",
      ].join(" ")}
    >
      {live ? (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-white shadow-[0_0_0_2px_rgba(255,255,255,0.4)] animate-ft-pulse motion-reduce:animate-none"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  );
}
