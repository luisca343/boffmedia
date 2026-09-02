import * as React from "react"
import { cn } from "../cn"
import { Icon } from "../primitives/icon"
import { useGiveawaysT } from "./i18n"
import { SrtPrizeTag } from "./SrtAtoms"
import { srtNum, srtPrizeMeta, type Sorteo, type SrtRequirement, type SrtStep } from "./giveaways-util"

// The detail-page pieces: prize showcase, requirement list, numbered steps and
// the transparency rules block. Prefix srt- in sorteos.css.

export function SrtPrizeShowcase({ sorteo }: { sorteo: Sorteo }) {
  const t = useGiveawaysT()
  const p = sorteo.prize
  const m = srtPrizeMeta(p.type)
  return (
    <div className="flex flex-col items-start gap-5 sm:flex-row">
      {/* [deferred] <image-slot> prize art — shows the tinted glyph until upload exists */}
      <div className="relative aspect-square w-full flex-none border border-solid border-line-2 bg-base-2 cut-corner cut-corner-edge [--cut-line:var(--line-2)] [--cut-lg:14px] sm:aspect-square sm:w-[168px] max-sm:aspect-[16/9]">
        <span aria-hidden className="absolute inset-0 z-0 grid place-items-center text-accent opacity-[0.28]">
          <Icon name={m.icon} size={70} />
        </span>
        <span aria-hidden className="pointer-events-none absolute inset-0 z-[1] opacity-30 mix-blend-multiply [background:repeating-linear-gradient(to_bottom,transparent_0_3px,rgba(0,0,0,0.25)_3px_4px)]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-3 flex flex-wrap gap-2.5">
          <SrtPrizeTag type={p.type} winners={p.winners} />
        </div>
        <h4 className="text-[clamp(24px,2.4vw,32px)]/none">{p.name}</h4>
        <div className="mt-3 flex items-baseline gap-2.5">
          <b className="font-display text-[34px]/none font-extrabold italic text-accent">{srtNum(p.value)} €</b>
          <span className="font-mono text-[10px]/none font-medium uppercase tracking-[0.1em] text-txt-muted">{t("approxValue")}</span>
        </div>
        <ul className="mt-4 grid list-none gap-2">
          {p.items.map((it, i) => (
            <li key={i} className="flex items-center gap-2.5 text-[14px] text-txt">
              <Icon name="check" size={15} className="flex-none text-accent" />
              {it.name}
              <b className="ml-auto font-mono text-[13px]/none font-bold text-accent">×{it.qty}</b>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function SrtReqList({ requirements }: { requirements: SrtRequirement[] }) {
  const t = useGiveawaysT()
  return (
    <ul className="grid list-none gap-2.5">
      {requirements.map((r, i) => (
        <li key={i} className={cn("flex items-center gap-3 border border-solid border-line border-l-[3px] bg-panel-2 px-[14px] py-3", r.met ? "border-l-ok" : "border-l-warn")}>
          <span className={cn("grid h-8 w-8 flex-none place-items-center border border-solid", r.met ? "border-[color-mix(in_srgb,var(--ok)_40%,var(--line-2))] text-ok" : "border-line-2 text-txt-muted")}>
            <Icon name={r.icon} size={16} />
          </span>
          <span className="min-w-0 flex-1 text-[14px] text-txt">{r.label}</span>
          <span className={cn("inline-flex flex-none items-center gap-1.5 font-mono text-[9.5px]/none font-semibold uppercase tracking-[0.08em]", r.met ? "text-ok" : "text-warn")}>
            <Icon name={r.met ? "check" : "alert"} size={12} />
            {r.met ? t("requirementMet") : t("requirementPending")}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function SrtSteps({ steps }: { steps: SrtStep[] }) {
  const t = useGiveawaysT()
  return (
    <div className="grid">
      {steps.map((s, i) => {
        const last = i === steps.length - 1
        return (
          <div key={i} className={cn("relative flex gap-4", last ? "pb-0" : "pb-5")}>
            {!last && <span aria-hidden className={cn("absolute bottom-0.5 left-[18px] top-[38px] w-0.5", s.done ? "bg-accent" : "bg-line")} />}
            <span className={cn("relative z-[1] grid h-[38px] w-[38px] flex-none place-items-center font-display text-[17px]/none font-extrabold italic cut-seal cut-seal-edge [--cut:8px]", s.done ? "border border-solid border-accent [--cut-line:var(--accent)] bg-accent text-accent-ink" : "border border-solid border-line-2 [--cut-line:var(--line-2)] bg-panel-2 text-txt-muted")}>
              {s.done ? <Icon name="check" size={16} /> : i + 1}
            </span>
            <div className="pt-2">
              <div className="text-[15px]/[1.4] text-txt">{s.label}</div>
              {s.done && (
                <span className="mt-[5px] inline-flex items-center gap-1.5 font-mono text-[10px]/none font-semibold uppercase tracking-[0.08em] text-ok">
                  <Icon name="check" size={11} />
                  {t("stepDone")}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function SrtRules({ rules, seed }: { rules: string[]; seed?: number | null }) {
  const t = useGiveawaysT()
  return (
    <>
      <ul className="grid list-none gap-3">
        {rules.map((r, i) => (
          <li key={i} className="flex items-start gap-3 text-[14px]/[1.55] text-txt-muted text-pretty">
            <span className="mt-px grid h-5 w-5 flex-none place-items-center border border-solid border-accent-line text-accent">
              <Icon name="check" size={12} />
            </span>
            {r}
          </li>
        ))}
      </ul>
      {seed != null && (
        <div className="mt-4 flex items-center gap-3 border border-solid border-[color-mix(in_srgb,var(--info)_30%,transparent)] bg-[color:var(--info-soft)] px-[15px] py-3">
          <Icon name="lock" size={18} className="flex-none text-[color:var(--info)]" />
          <span className="text-[13px]/[1.45] text-txt">
            {t("verifiableLabel")} <code className="font-mono text-[12px]/none font-semibold text-[color:var(--info)]">#{seed}</code>. {t("recomputeNote")}
          </span>
        </div>
      )}
    </>
  )
}
