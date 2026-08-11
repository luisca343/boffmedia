"use client"

import { useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Button, Panel, Kicker, Icon } from "@boffmedia/ui"
import type { TcgpData } from "../_lib/useTcgpCards"
import type { RecentUpdate } from "../_lib/useCollection"
import { rarityMeta, timeAgo, padNum } from "../_lib/tcgp-maps"
import { TcgRing, TcgStatTile, TcgSetProgress, TcgTypePip } from "./tcgp-kit"

interface Props {
  data: TcgpData
  owned: Record<string, number>
  effective: (id: string) => number
  recent: RecentUpdate[]
  loggedIn: boolean
  go: (view: "cartas" | "coleccion" | "sobres") => void
  onGallery: (username: string) => void
}

function isEx(name: string): boolean {
  return /\bex\b/i.test(name)
}

export function PanelView({ data, owned, effective, recent, loggedIn, go, onGallery }: Props) {
  const t = useTranslations("tcgpocket")
  const locale = useLocale()
  const [user, setUser] = useState("")

  const stats = useMemo(() => {
    const total = data.cards.length
    const have = data.cards.filter((c) => effective(c.id) > 0).length
    const dupes = Object.values(owned).reduce((a, n) => a + Math.max(0, n - 1), 0)
    const ex = data.cards.filter((c) => isEx(c.name) && effective(c.id) > 0).length
    const crown = data.cards.filter((c) => rarityMeta(c.rarity).kind === "crown" && effective(c.id) > 0).length
    return { total, have, dupes, ex, crown, pct: total ? Math.round((have / total) * 100) : 0 }
  }, [data.cards, owned, effective])

  const submit = () => { if (user.trim()) onGallery(user.trim().toLowerCase()) }

  return (
    <div className="motion-safe:animate-[bm-modal-in_.3s_both] motion-reduce:animate-none">
      {/* hero */}
      <div className="cut-corner cut-corner-edge relative mb-6 grid grid-cols-1 items-center gap-[26px] border border-solid border-line bg-gradient-to-br from-panel to-base-2 p-[clamp(20px,3vw,34px)] sm:grid-cols-[auto_1fr]">
        <div className="justify-self-center">
          <TcgRing pct={stats.pct} size={132}>
            <b className="font-display text-[30px] font-bold leading-none text-txt">{stats.pct}%</b>
            <small className="mt-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-txt-muted">{t("app.panel.collection")}</small>
          </TcgRing>
        </div>
        <div className="relative">
          <Kicker>{t("app.panel.kicker")}</Kicker>
          <h1 className="mt-1 font-display text-[clamp(28px,4.4vw,44px)] font-bold uppercase leading-[0.96] tracking-[0.01em] text-txt">
            TCG <span className="text-accent">Pocket</span>
          </h1>
          <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-txt-muted">{t("app.panel.lead")}</p>
          <div className="mt-[18px] flex flex-wrap gap-[10px]">
            <Button variant="pri" icon="cards" onClick={() => go("cartas")}>{t("app.panel.exploreCards")}</Button>
            <Button icon="grid" onClick={() => go("coleccion")}>{t("app.panel.myCollection")}</Button>
            <Button variant="ghost" icon="inbox" iconRight="arrow" onClick={() => go("sobres")}>{t("app.panel.openPacks")}</Button>
          </div>
        </div>
      </div>

      {/* stat tiles */}
      <div className="mb-6 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <TcgStatTile icon="cards" label={t("app.panel.owned")} value={stats.have} sub={t("app.panel.ofTotal", { total: stats.total })} />
        <TcgStatTile icon="layers" label={t("app.panel.expansions")} value={data.sets.length} sub={t("app.panel.activeSets")} hue="var(--info)" />
        <TcgStatTile icon="star" label={t("app.panel.exCards")} value={stats.ex} sub={t("app.panel.specialArt")} hue="var(--warn)" />
        <TcgStatTile icon="trophy" label={t("app.panel.crowns")} value={stats.crown} sub={t("app.panel.maxRarity")} hue="var(--accent)" />
        <TcgStatTile icon="copy" label={t("app.panel.dupes")} value={stats.dupes} sub={t("app.panel.forTrade")} hue="var(--ok)" />
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-5">
          <Panel title={t("app.panel.progressBySet")} aside={<Button size="sm" variant="ghost" iconRight="arrow" onClick={() => go("coleccion")}>{t("app.panel.viewCollection")}</Button>}>
            <div className="grid gap-4">
              {data.sets.map((s) => {
                const have = s.cards.filter((c) => effective(c.id) > 0).length
                return <TcgSetProgress key={s.id} label={s.name} sub={s.id} have={have} total={s.cards.length} />
              })}
            </div>
          </Panel>
        </div>

        <div className="grid gap-5">
          <Panel title={t("app.panel.playerGallery")}>
            <p className="mb-3 text-[13px] leading-relaxed text-txt-muted">{t("app.panel.galleryHint")}</p>
            <div className="flex gap-[10px]">
              <label className="flex flex-1 items-center gap-2 border border-solid border-line-2 bg-base px-3 py-2">
                <Icon name="search" size={18} className="text-txt-dim" />
                <input className="w-full bg-transparent font-body text-[14px] text-txt outline-none placeholder:text-txt-dim"
                  placeholder={t("app.panel.usernamePlaceholder")} value={user}
                  onChange={(e) => setUser(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit() }} />
              </label>
              <Button variant="pri" icon="arrow" onClick={submit} disabled={!user.trim()}>{t("app.panel.view")}</Button>
            </div>
          </Panel>

          <Panel title={t("app.panel.recentActivity")} aside={<span className="mono-label">{recent.length}</span>}>
            {!loggedIn ? (
              <p className="py-2 text-[13px] text-txt-dim">{t("app.panel.loginForActivity")}</p>
            ) : recent.length === 0 ? (
              <p className="py-2 text-[13px] text-txt-dim">{t("app.panel.noActivity")}</p>
            ) : (
              <div className="grid gap-[2px]">
                {recent.slice(0, 8).map((u) => {
                  const card = data.byId[u.cardId]
                  const name = card?.name || u.cardName
                  if (!name) return null
                  return (
                    <div key={u.id} className="flex items-center gap-[10px] border-b border-solid border-line py-[10px] last:border-b-0">
                      <TcgTypePip type={card?.types?.[0] || "colorless"} size={18} />
                      <div>
                        <div className="text-[14px] leading-tight text-txt">{name}</div>
                        <div className="font-mono text-[11px] leading-none text-txt-dim">{card ? `${card.setId} · #${padNum(card.localId || card.id)}` : ""}</div>
                      </div>
                      <span className={"ml-auto font-mono text-[13px] font-bold " + (u.count > 0 ? "text-ok" : "text-bad")}>{u.count > 0 ? "+" : ""}{u.count}</span>
                      <span className="min-w-[80px] text-right font-mono text-[11px] leading-none text-txt-dim">{timeAgo(u.at, locale)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
