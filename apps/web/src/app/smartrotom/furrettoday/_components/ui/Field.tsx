/** Pink eyebrow label above a control. */
export function Field({
  label,
  full = false,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${full ? "col-span-full" : ""}`}>
      <span className="font-ft-ui mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.18em] text-ft-pink">
        {label}
      </span>
      {children}
    </label>
  );
}

/** The all-caps kicker used on its own, outside a form. */
export function Eyebrow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={[
        "font-ft-ui text-[11px] font-extrabold uppercase tracking-[0.18em]",
        className ?? "text-ft-pink",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/** Small uppercase metadata: bylines, dates, read times. */
export function Meta({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={[
        "font-ft-ui text-[13px] font-medium uppercase tracking-[0.04em]",
        className ?? "text-ft-ink/70",
      ].join(" ")}
    >
      {children}
    </span>
  );
}
