/**
 * The breaking-news rail. The track holds the items twice and slides exactly
 * -50%, so the second copy lands where the first began and the loop is seamless.
 */
export function Marquee({
  items,
  tone = "yellow",
  label,
}: {
  items: string[];
  tone?: "yellow" | "pink";
  label: string;
}) {
  if (items.length === 0) return null;

  const shell =
    tone === "pink"
      ? "bg-ft-pink text-white border-y-ft border-ft-ink"
      : "bg-ft-yellow text-ft-ink border-y-ft border-ft-ink";
  const sep = tone === "pink" ? "bg-ft-yellow" : "bg-ft-pink";

  return (
    <div className={`overflow-hidden ${shell}`} aria-label={label} role="region">
      <div className="animate-ft-marquee inline-flex whitespace-nowrap motion-reduce:animate-none">
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="font-ft-display inline-flex items-center gap-3.5 px-5 py-2 text-lg tracking-[0.05em]"
            // The duplicate half is decoration; a screen reader should read the
            // headlines once, not twice.
            aria-hidden={i >= items.length}
          >
            <span
              className={`inline-block h-2 w-2 rotate-45 rounded-full border-2 border-ft-ink ${sep}`}
              aria-hidden="true"
            />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
