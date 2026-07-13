/** The rule-and-numeral that opens every section of the issue. */
export function SectionHeader({
  eyebrow,
  title,
  number,
  hint,
}: {
  eyebrow: string;
  title: string;
  /** The big pink stamped numeral: "01", "02"… */
  number: string;
  hint?: string;
}) {
  return (
    <div className="border-ft flex items-end justify-between gap-6 border-x-0 border-t-0 border-b-ft-ink pb-3">
      <div className="flex items-end gap-4">
        <span className="ft-stamp shrink-0" aria-hidden="true">
          {number}
        </span>
        <div className="min-w-0">
          <div className="font-ft-ui text-[11px] font-extrabold uppercase tracking-[0.18em] text-ft-pink">
            {eyebrow}
          </div>
          <h2 className="font-ft-display mt-1 text-[clamp(2.25rem,5vw,4rem)] leading-[0.95] tracking-[0.02em]">
            {title}
          </h2>
        </div>
      </div>
      {hint ? (
        <span className="font-ft-ui hidden shrink-0 self-end pb-2 text-[13px] font-medium uppercase tracking-[0.04em] text-ft-ink/70 md:block">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
