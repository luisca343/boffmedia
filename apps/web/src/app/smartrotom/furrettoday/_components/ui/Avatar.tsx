import { ACCENT_BG, ACCENT_ON, accentFor } from "../../_utils/accents";

/**
 * The initial-in-a-circle used for bylines and reader comments. The colour is
 * hashed from the name, so the same person is always the same colour — via the
 * literal accent maps, never an interpolated class.
 */
export function Avatar({
  name,
  size = 40,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const accent = accentFor(name);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      className={[
        "font-ft-display border-ft inline-flex shrink-0 items-center justify-center",
        "rounded-full border-ft-ink leading-none",
        ACCENT_BG[accent],
        ACCENT_ON[accent],
        className ?? "",
      ].join(" ")}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
