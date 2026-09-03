"use client"

import { useMemo, useState } from "react"

import { Button, Panel, Empty } from "@boffmedia/ui"
import type { TcgCard } from "./service"
import type { TcgpData, TcgpSet } from "./useTcgpCards"
import { typeColor } from "./tcgp-maps"
import { TcgPackTile, TcgCardGrid } from "./tcgp-kit"
import { TCGP_NS, useToolT } from "../i18n"

interface Props {
  data: TcgpData
  effective: (id: string) => number
  initialSetId?: string
  onOpenCard: (card: TcgCard, list: TcgCard[]) => void
}

const HUES = ["fire", "water", "psychic", "lightning", "grass"]

function PackDetail({ set, pack, effective, onBack, onOpenCard }: {
  set: TcgpSet
  pack: string
  effective: (id: string) => number
  onBack: () => void
  onOpenCard: (card: TcgCard, list: TcgCard[]) => void
}) {
  const t = useToolT(TCGP_NS)
  const cards = useMemo(() => set.cards.filter((c) => (c.boosters || []).some((b) => b.name === pack)), [set.cards, pack])
  return (
    <div className="motion-safe:animate-[bm-modal-in_.3s_both] motion-reduce:animate-none">
      <div className="mb-5"><Button size="sm" variant="ghost" icon="back" onClick={onBack}>{t("app.sobres.title")}</Button></div>
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[auto_1fr]">
        <div className="mx-auto w-[11.875rem] md:mx-0">
          <TcgPackTile setId={set.id} name={pack} meta={set.name} hue={typeColor("fire")} onOpen={() => {}} />
        </div>
        <div className="grid gap-5">
          <div>
            <h2 className="font-display text-[1.5rem] font-bold uppercase leading-none text-txt">{pack}</h2>
            <p className="mt-1 text-[0.875rem] leading-relaxed text-txt-muted">{set.id} · {set.name} · {t("app.sobres.cardCount", { count: cards.length })}</p>
          </div>
          <Panel title={t("app.sobres.packCards")} aside={<span className="mono-label">{cards.length}</span>}>
            {cards.length === 0 ? (
              <Empty icon="cards" title={t("app.empty.title")} lead={t("app.sobres.noPackCards")} />
            ) : (
              <TcgCardGrid cards={cards} effective={effective} allColored density="comoda" onOpen={(c) => onOpenCard(c, cards)} />
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}

export function SobresView({ data, effective, initialSetId, onOpenCard }: Props) {
  const t = useToolT(TCGP_NS)
  const [sel, setSel] = useState<{ setId: string; pack: string } | null>(null)

  const sets = initialSetId ? data.sets.filter((s) => s.id === initialSetId) : data.sets

  if (sel) {
    const set = data.sets.find((s) => s.id === sel.setId)
    if (set) return <PackDetail set={set} pack={sel.pack} effective={effective} onBack={() => setSel(null)} onOpenCard={onOpenCard} />
  }

  return (
    <div className="motion-safe:animate-[bm-modal-in_.3s_both] motion-reduce:animate-none">
      {/* No header, by the same rule as CartasView. */}
      <p className="mb-5 max-w-[58ch] text-pretty text-[0.9375rem] leading-[1.5] text-txt-muted">
        {t("app.sobres.lead")}
      </p>

      {sets.map((s) => (
        <section key={s.id} className="mb-[1.625rem]">
          <div className="mb-3 flex items-center gap-[0.5625rem]">
            <span className="cut cut-edge-slant [--cut:3px] [--cut-line:var(--accent)] bg-accent px-[0.4375rem] py-1 font-display text-[0.75rem] font-bold leading-none text-accent-ink">{s.id}</span>
            <h2 className="font-display text-[1.125rem] font-bold uppercase leading-none tracking-[0.03em] text-txt">{s.name}</h2>
          </div>
          {s.packs.length === 0 ? (
            <p className="text-[0.8125rem] text-txt-dim">{t("app.sobres.noPacks")}</p>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
              {s.packs.map((p, i) => (
                <TcgPackTile key={p.id} setId={s.id} name={p.name} meta={s.name}
                  hue={typeColor(HUES[i % HUES.length])} onOpen={() => setSel({ setId: s.id, pack: p.name })} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
