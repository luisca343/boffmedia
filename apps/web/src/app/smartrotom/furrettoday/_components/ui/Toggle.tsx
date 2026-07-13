/**
 * The editor's publish/feature switch: a checkbox drawn as a stamped pill. The
 * real input stays in the DOM (visually hidden, not `display:none`) so the
 * control is still keyboard-reachable and announced.
 */
export function Toggle({
  checked,
  label,
  tone,
  onChange,
}: {
  checked: boolean;
  label: string;
  tone: "cyan" | "pink";
  onChange: () => void;
}) {
  const ON = {
    cyan: "bg-ft-cyan text-ft-ink",
    pink: "bg-ft-pink text-white",
  } as const;

  return (
    <label
      className={[
        "font-ft-ui inline-flex cursor-pointer items-center gap-1.5",
        "rounded-ft-pill border-ft-hair border-ft-ink px-2.5 py-1",
        "text-[11px] font-bold uppercase tracking-[0.05em]",
        "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ft-pink",
        checked ? ON[tone] : "bg-white text-ft-ink",
      ].join(" ")}
    >
      <span
        className={[
          "inline-flex h-3 w-3 items-center justify-center rounded-[4px]",
          "border-ft-hair border-ft-ink text-[10px] font-black leading-none",
          checked ? "bg-ft-ink text-ft-yellow" : "bg-transparent text-transparent",
        ].join(" ")}
        aria-hidden="true"
      >
        ✓
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {label}
    </label>
  );
}
