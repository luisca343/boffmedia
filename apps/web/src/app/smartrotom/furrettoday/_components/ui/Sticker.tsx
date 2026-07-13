/** The rotated, bobbing badge slapped on the cover. */
export function Sticker({
  bob = false,
  className,
  children,
  style,
}: {
  bob?: boolean;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={[
        "font-ft-display border-ft inline-block whitespace-nowrap",
        "rounded-ft-pill border-ft-ink bg-ft-yellow px-3.5 pb-1 pt-1.5",
        "tracking-[0.04em] text-ft-ink shadow-ft-pop-sm",
        bob
          ? "animate-ft-bob motion-reduce:animate-none"
          : "-rotate-3",
        className ?? "",
      ].join(" ")}
      style={style}
    >
      {children}
    </span>
  );
}
