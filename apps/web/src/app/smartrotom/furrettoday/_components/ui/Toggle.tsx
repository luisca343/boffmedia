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
  disabled = false,
}: {
  checked: boolean;
  label: string;
  tone: "cyan" | "pink";
  onChange: () => void;
  disabled?: boolean;
}) {
  const ON = {
    cyan: "bg-ft-cyan text-ft-ink",
    pink: "bg-ft-pink text-white",
  } as const;

  return (
    <label
      className={[
        "font-ft-ui inline-flex items-center gap-1.5",
        disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer",
        "rounded-ft-pill border-ft-hair border-ft-ink px-2.5 py-1",
        "text-[0.6875rem] font-bold uppercase tracking-[0.05em]",
        "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ft-pink",
        checked ? ON[tone] : "bg-white text-ft-ink",
      ].join(" ")}
    >
      <span
        className={[
          "inline-flex h-3 w-3 items-center justify-center rounded-[4px]",
          "border-ft-hair border-ft-ink text-[0.625rem] font-black leading-none",
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
        disabled={disabled}
        className="sr-only"
      />
      {label}
    </label>
  );
}
