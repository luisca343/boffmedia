"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Panel, Empty } from "@boffmedia/ui"
import type { TcgCard } from "@boffmedia/shared"
import type { TcgpData, TcgpSet } from "../_lib/useTcgpCards"
import { typeColor } from "../_lib/tcgp-maps"
import { TcgPackTile, TcgCardGrid } from "./tcgp-kit"

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
  const t = useTranslations("tcgpocket")
  const cards = useMemo(() => set.cards.filter((c) => (c.boosters || []).some((b) => b.name === pack)), [set.cards, pack])
  return (
    <div className="motion-safe:animate-[bm-modal-in_.3s_both] motion-reduce:animate-none">
      <div className="mb-5"><Button size="sm" variant="ghost" icon="back" onClick={onBack}>{t("app.sobres.title")}</Button></div>
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[auto_1fr]">
        <div className="mx-auto w-[190px] md:mx-0">
          <TcgPackTile setId={set.id} name={pack} meta={set.name} hue={typeColor("fire")} onOpen={() => {}} />
        </div>
        <div className="grid gap-5">
          <div>
            <h2 className="font-display text-[24px] font-bold uppercase leading-none text-txt">{pack}</h2>
            <p className="mt-1 text-[14px] leading-relaxed text-txt-muted">{set.id} · {set.name} · {t("app.sobres.cardCount", { count: cards.length })}</p>
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
  const t = useTranslations("tcgpocket")
  const [sel, setSel] = useState<{ setId: string; pack: string } | null>(null)

  const sets = initialSetId ? data.sets.filter((s) => s.id === initialSetId) : data.sets

  if (sel) {
    const set = data.sets.find((s) => s.id === sel.setId)
    if (set) return <PackDetail set={set} pack={sel.pack} effective={effective} onBack={() => setSel(null)} onOpenCard={onOpenCard} />
  }

  return (
    <div className="motion-safe:animate-[bm-modal-in_.3s_both] motion-reduce:animate-none">
      <div className="mb-5">
        <h1 className="font-display text-[clamp(26px,4vw,38px)] font-bold uppercase leading-none tracking-[0.01em] text-txt">{t("app.sobres.title")}</h1>
        <p className="mt-[6px] max-w-[60ch] text-[14px] leading-relaxed text-txt-muted">{t("app.sobres.lead")}</p>
      </div>

      {sets.map((s) => (
        <section key={s.id} className="mb-[26px]">
          <div className="mb-3 flex items-center gap-[9px]">
            <span className="cut [--cut:3px] bg-accent px-[7px] py-1 font-display text-[12px] font-bold leading-none text-accent-ink">{s.id}</span>
            <h2 className="font-display text-[18px] font-bold uppercase leading-none tracking-[0.03em] text-txt">{s.name}</h2>
          </div>
          {s.packs.length === 0 ? (
            <p className="text-[13px] text-txt-dim">{t("app.sobres.noPacks")}</p>
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
