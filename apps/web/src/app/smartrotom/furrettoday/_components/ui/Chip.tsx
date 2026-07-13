/** The section filter. Yellow on hover, hot pink once it is the active one. */
export function Chip({
  active = false,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={[
        "font-ft-ui inline-flex items-center gap-1.5 whitespace-nowrap",
        "rounded-ft-pill border-2 border-ft-ink px-3.5 py-1.5",
        "text-xs font-bold uppercase tracking-[0.06em]",
        "transition-colors duration-100",
        active
          ? "bg-ft-pink text-white"
          : "bg-white text-ft-ink hover:bg-ft-yellow",
        className ?? "",
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

/** The non-interactive form — an article's tags, which filter nothing. */
export function Tag({
  className,
  children,
  style,
}: {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={[
        "font-ft-ui inline-flex items-center gap-1.5 whitespace-nowrap",
        "rounded-ft-pill border-2 border-ft-ink bg-white px-3.5 py-1.5",
        "text-xs font-bold uppercase tracking-[0.06em] text-ft-ink",
        className ?? "",
      ].join(" ")}
      style={style}
    >
      {children}
    </span>
  );
}
