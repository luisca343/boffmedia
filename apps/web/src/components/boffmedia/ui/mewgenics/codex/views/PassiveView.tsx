"use client"

import { useTranslations } from "next-intl"
import { MewPanel, MewText } from "../../MewAtoms"
import { mewHuman } from "../../mew-util"
import { MewEffects, MewRef } from "../MewRefs"
import { MewCol, MewDesc, MewDetail, MewFacts, MewGrid2, MewHero, MewTag, rows, type ViewProps } from "./scaffold"

export function PassiveView({ rec, onNav }: ViewProps) {
  const t = useTranslations("mewgenics")
  return (
    <MewDetail>
      <MewHero cat="passives" rec={rec} badges={rec.cls ? <MewRef id={rec.cls} cat="classes" icon="star" onNav={onNav} label={mewHuman(rec.cls)} /> : undefined} />
      <MewDesc>{rec.desc}</MewDesc>
      <MewGrid2>
        <MewCol>
          {rec.base && Object.keys(rec.base).length > 0 && (
            <MewPanel title={t("panel.baseEffect")} icon="bolt"><MewEffects map={rec.base} onNav={onNav} /></MewPanel>
          )}
          {rec.ranks && rec.ranks.length > 0 && (
            <MewPanel title={t("panel.ranks")} icon="layers" count={rec.ranks.length}>
              <div className="flex flex-col gap-3">
                {rec.ranks.map((rk) => (
                  <div className="grid grid-cols-[28px_1fr] items-start gap-[11px]" key={rk.r}>
                    <span className="grid h-7 w-7 place-items-center pt-[3px] text-[13px]/none text-[color:var(--mwp-paper)] [font-family:var(--mwf-disp)] [border-radius:50%_45%_52%_48%/48%_52%_45%_50%] border-2 border-solid border-[color:var(--mwp-red-deep)] bg-[color:var(--mwp-red)] [transform:rotate(-3deg)]">{rk.r}</span>
                    <div className="flex min-w-0 flex-col gap-1.5">
                      {rk.desc ? <MewText>{rk.desc}</MewText> : null}
                      {rk.passives && <MewEffects map={rk.passives} onNav={onNav} />}
                    </div>
                  </div>
                ))}
              </div>
            </MewPanel>
          )}
        </MewCol>
        <MewCol>
          <MewPanel title={t("panel.data")} icon="database">
            <MewFacts
              rows={rows([
                { label: t("label.class"), value: rec.cls ? mewHuman(rec.cls) : t("label.general") },
                rec.shield != null && { label: t("label.shield"), value: rec.shield },
                { label: t("label.id"), value: rec.id, mono: true },
              ])}
            />
          </MewPanel>
          {Array.isArray(rec.tags) && rec.tags.length > 0 && (
            <MewPanel title={t("panel.tags")} icon="bookmark">
              <div className="flex flex-wrap gap-1.5">{rec.tags.map((t) => <MewTag key={t}>{mewHuman(t)}</MewTag>)}</div>
            </MewPanel>
          )}
        </MewCol>
      </MewGrid2>
    </MewDetail>
  )
}
