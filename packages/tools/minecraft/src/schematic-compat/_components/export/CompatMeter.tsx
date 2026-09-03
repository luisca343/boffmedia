"use client";

import { useToolT } from "../../../i18n";
import { TONE, type Tone } from "../ui/sch-tokens";

/** «N de M resueltos» readiness ring — amber while blocked, green at 100%. */
export function CompatMeter({
  resolved,
  total,
  blocked,
  size = 64,
}: {
  resolved: number;
  total: number;
  blocked: number;
  size?: number;
}) {
  const t = useToolT("tools.schematicCompat");
  const pct = total ? Math.round((resolved / total) * 100) : 0;
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const tone: Tone = blocked > 0 ? "warn" : pct >= 100 ? "ok" : "accent";
  return (
    <div className="relative flex items-center gap-3 shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="block shrink-0">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="4" fill="none" style={{ stroke: "var(--line-2)" }} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth="4"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-[stroke-dashoffset] duration-500"
          style={{ stroke: TONE[tone].cssVar }}
        />
      </svg>
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 flex items-baseline justify-center gap-px pointer-events-none"
        style={{ width: size }}
      >
        <b className="font-display italic font-extrabold text-[1.375rem] text-txt leading-none">{pct}</b>
        <small className="font-mono text-[0.625rem] text-txt-dim">%</small>
      </div>
      <div className="flex flex-col gap-[3px] min-w-0">
        <span className="font-mono text-[0.625rem] tracking-[0.1em] uppercase text-txt-muted">{t("meter.label")}</span>
        <span className="text-[0.78125rem] text-txt-dim">
          <b className="text-txt font-semibold">{resolved}</b>/{total} {t("meter.resolved")}
          {blocked > 0 ? (
            <>
              {" · "}
              <span className="text-warn">{t("meter.blocked", { count: blocked })}</span>
            </>
          ) : null}
        </span>
      </div>
    </div>
  );
}
