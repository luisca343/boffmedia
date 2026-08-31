"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { MewPanel, MewText } from "../../MewAtoms"
import { MewData } from "../../mew-store"
import { mewHuman } from "../../mew-util"
import { MewEffects, MewRef, MewRefList } from "../MewRefs"
import { MewDesc, MewDetail, MewFacts, MewHero, MewSections, MewSubLabel, MewTag, MewMoreTag, mewTruncate, rows, type ViewProps } from "./scaffold"

export function PassiveView({ rec, onNav }: ViewProps) {
  const t = useTranslations("mewgenics")
  const grantedByData = React.useMemo(() => {
    return MewData.select.passiveGrantedBy(rec.id)
  }, [rec.id])
  const { list: grantedBy, more: grantedByMore } = mewTruncate(grantedByData.recs, 12)

  return (
    <MewDetail id={rec.id}>
      <MewHero cat="passives" rec={rec} badges={rec.cls ? <MewRef id={rec.cls} cat="classes" icon="star" onNav={onNav} label={mewHuman(rec.cls)} /> : undefined} />
      <MewDesc>{rec.desc}</MewDesc>
      <MewSections>
        {rec.base && Object.keys(rec.base).length > 0 && (
          <MewPanel title={t("panel.baseEffect")} icon="bolt"><MewEffects map={rec.base} onNav={onNav} /></MewPanel>
        )}
        {rec.ranks && rec.ranks.length > 0 && (
          <MewPanel title={t("panel.ranks")} icon="layers" count={rec.ranks.length} span="full">
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
        {grantedBy.length > 0 && (
          <MewPanel title={t("panel.passivesGranted")} icon="shield" span="full">
            <MewSubLabel>{mewHuman(grantedByData.kind)}</MewSubLabel>
            <div className="flex flex-wrap gap-1.5">
              <MewRefList ids={grantedBy.map((a) => a.id)} cat={grantedByData.kind as any} icon="shield" onNav={onNav} />
              {grantedByMore > 0 && <MewMoreTag n={grantedByMore} />}
            </div>
          </MewPanel>
        )}
        <MewPanel title={t("panel.data")} icon="database">
          <MewFacts
            rows={rows([
              { label: t("label.class"), value: rec.cls ? mewHuman(rec.cls) : t("label.general") },
              rec.shield != null && { label: t("label.shield"), value: rec.shield },
            ])}
          />
        </MewPanel>
        {Array.isArray(rec.tags) && rec.tags.length > 0 && (
          <MewPanel title={t("panel.tags")} icon="bookmark">
            <div className="flex flex-wrap gap-1.5">{rec.tags.map((t) => <MewTag key={t}>{mewHuman(t)}</MewTag>)}</div>
          </MewPanel>
        )}
      </MewSections>
    </MewDetail>
  )
}
