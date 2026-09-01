"use client"

import { useMemo, useState } from "react"

import { Button, Panel, SearchInput, Select, Toggle, Banner, Empty, Icon, ToolBar, ToolBarSpacer } from "@boffmedia/ui"
import { useToolPending, useToolSession } from "@boffmedia/tool-kit"
import type { TcgCard } from "./service"
import type { TcgpData } from "./useTcgpCards"
import { useBestPack } from "./useBestPack"
import { padNum, timeAgo } from "./tcgp-maps"
import { TcgCardGrid, TcgBar, TcgOddsTable, TcgTypePip, type OddsTableRow } from "./tcgp-kit"
import { TCGP_NS, useLocale, optionalT, useToolT } from "../i18n"

interface Collection {
  owned: Record<string, number>
  effective: (id: string) => number
  setChange: (id: string, d: number) => void
  dirtyCount: number
  discard: () => void
  save: () => void
  saving: boolean
  editable: boolean
  loggedIn: boolean
  recent: { id: string | number; cardId: string; count: number; at: string; cardName?: string }[]
}

interface Props {
  data: TcgpData
  collection: Collection
  username: string | null
  onOpenCard: (card: TcgCard, list: TcgCard[]) => void
}

function CGroup({ set, cards, effective, editable, hideMissing, onAdd, onRemove, onOpen }: {
  set: { id: string; name: string }
  cards: TcgCard[]
  effective: (id: string) => number
  editable: boolean
  hideMissing: boolean
  onAdd: (c: TcgCard) => void
  onRemove: (c: TcgCard) => void
  onOpen: (c: TcgCard) => void
}) {
  const [open, setOpen] = useState(true)
  const have = cards.filter((c) => effective(c.id) > 0).length
  const p = cards.length ? Math.round((have / cards.length) * 100) : 0
  return (
    <div className="mb-[18px]">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="cut-corner cut-corner-edge [--cut-line:var(--line)] hover:[--cut-line:var(--accent-line)] flex w-full items-center gap-[14px] border border-solid border-line bg-panel p-[13px_16px] text-left transition-[background,border-color] hover:border-accent-line hover:bg-panel-2">
        <span className="cut cut-edge-slant [--cut:3px] [--cut-line:var(--accent)] flex-none bg-accent px-[7px] py-1 font-display text-[12px] font-bold leading-none text-accent-ink">{set.id}</span>
        <span className="font-display text-[17px] font-bold uppercase leading-none tracking-[0.02em] text-txt">{set.name}</span>
        <span className="font-mono text-[12px] leading-none text-txt-muted">{have}/{cards.length}</span>
        <span className="hidden max-w-[220px] flex-1 sm:block"><TcgBar pct={p} /></span>
        <span className="ml-auto font-mono text-[13px] font-bold leading-none text-accent">{p}%</span>
        <Icon name="chevronDown" size={18} className={"text-txt-dim transition-transform " + (open ? "rotate-180" : "")} />
      </button>
      {open && (
        <div className="border border-t-0 border-solid border-line bg-base-2 p-4">
          <TcgCardGrid cards={cards} effective={effective} editable={editable} hideMissing={hideMissing}
            density="comoda" onAdd={onAdd} onRemove={onRemove} onOpen={editable ? undefined : onOpen} />
        </div>
      )}
    </div>
  )
}

function BestPackPanel({ viewerName }: { viewerName: string | null }) {
  const t = useToolT(TCGP_NS)
  const tl = (key: string, fallback: string) => optionalT(t, key, fallback)
  const { rows, loading, error, run } = useBestPack(viewerName)

  const tableRows: OddsTableRow[] = (rows || []).slice(0, 6).map((r) => ({
    pack: tl(`packs.${r.pack.toLowerCase()}`, r.pack),
    perSlot: r.perSlot,
    aggregate: r.aggregate,
    best: r.best,
  }))
  const best = rows?.[0]

  return (
    <Panel title={t("app.coleccion.bestPack")} aside={<Icon name="trophy" size={15} className="text-accent" />}>
      <p className="mb-3 text-[13px] leading-relaxed text-txt-muted">{t("app.coleccion.bestPackHint")}</p>
      {!rows ? (
        <Button size="sm" variant="pri" icon="sparkles" onClick={run} disabled={loading || !viewerName}>
          {loading ? t("app.coleccion.analyzing") : t("app.coleccion.analyze")}
        </Button>
      ) : error || tableRows.length === 0 ? (
        <p className="text-[13px] text-txt-dim">{t("app.coleccion.bestPackEmpty")}</p>
      ) : (
        <>
          {best && (
            <Banner tone="success" icon="gift" title={tl(`packs.${best.pack.toLowerCase()}`, best.pack)}>
              {t("app.coleccion.newCardOdds", { odds: (best.aggregate * 100).toFixed(2) + "%" })}
            </Banner>
          )}
          <div className="mt-3">
            <TcgOddsTable rows={tableRows}
              packLabel={t("app.coleccion.pack")} aggLabel={t("app.coleccion.new")} bestLabel={t("app.coleccion.best")}
              slotLabels={["1", "2", "3", "4", "5"].map((n) => t("app.coleccion.slot", { n }))} />
          </div>
        </>
      )}
    </Panel>
  )
}

export function ColeccionView({ data, collection, username, onOpenCard }: Props) {
  const t = useToolT(TCGP_NS)
  const locale = useLocale()
  const { user, signIn } = useToolSession()
  const pending = useToolPending("pokemon.tcgpocket")
  const { owned, effective, setChange, dirtyCount, discard, save, saving, editable, loggedIn, recent } = collection

  const [q, setQ] = useState("")
  const [setF, setSetF] = useState("")
  const [hideMissing, setHideMissing] = useState(false)

  const viewerName = username || user?.name || null

  const totals = useMemo(() => {
    const total = data.cards.length
    const have = data.cards.filter((c) => effective(c.id) > 0).length
    const dupes = Object.values(owned).reduce((a, n) => a + Math.max(0, n - 1), 0)
    return { total, have, dupes, pct: total ? Math.round((have / total) * 100) : 0 }
  }, [data.cards, owned, effective])

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase()
    return data.sets
      .filter((s) => !setF || s.id === setF)
      .map((s) => ({ set: s, cards: s.cards.filter((c) => !term || c.name.toLowerCase().includes(term) || c.id.toLowerCase().includes(term)) }))
      .filter((g) => g.cards.length)
  }, [data.sets, q, setF])

  return (
    <div className="motion-safe:animate-[bm-modal-in_.3s_both] motion-reduce:animate-none">
      {/* Signed out is a STATE, not a wall. This used to return a sign-in
          screen instead of the collection, which meant a player with no account
          had nothing at all — and in the desktop app, where the whole Tools
          section is usable without one, that reads as broken rather than
          gated. The collection below is real: it lives on this device, it is
          editable, and signing in is what makes it follow them elsewhere. */}
      {!username && !loggedIn && (
        <Banner
          tone="info"
          icon="user"
          title={t("app.coleccion.localTitle")}
          className="mb-5"
          actions={
            <Button size="sm" variant="pri" icon="user" onClick={signIn}>
              {t("app.coleccion.localSignIn")}
            </Button>
          }
        >
          {t("app.coleccion.localLead")}
        </Banner>
      )}
      {/* What has not reached the server yet. Only worth saying when there IS a
          server to reach — signed out, nothing is owed to anyone. */}
      {loggedIn && pending > 0 && (
        <Banner tone="warn" icon="refresh" className="mb-5">
          {t("app.coleccion.pendingSync", { count: pending })}
        </Banner>
      )}
      {/* No header, by the same rule as CartasView. Whose gallery this is — the
          one thing the tab row cannot say — is carried by the Banner below. */}
      <p className="mb-5 max-w-[58ch] text-pretty text-[15px] leading-[1.5] text-txt-muted">
        {t("app.coleccion.summary", { have: totals.have, total: totals.total, pct: totals.pct, dupes: totals.dupes })}
      </p>

      {username && (
        <div className="mb-4">
          <Banner tone="info" icon="user" title={t("app.coleccion.viewingGallery", { user: username })}
            actions={<Button size="sm" variant="ghost" href="/pokemon/tcgpocket/coleccion">{t("app.coleccion.backToMine")}</Button>}>
            {t("app.coleccion.readOnly")}
          </Banner>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1fr_minmax(280px,340px)]">
        <div>
          <ToolBar>
            <SearchInput value={q} onChange={setQ} placeholder={t("app.coleccion.searchPlaceholder")} className="min-w-[180px] flex-1" />
            <Select value={setF} onChange={setSetF} ariaLabel={t("app.filters.expansion")} className="w-auto min-w-[140px]"
              options={[{ value: "", label: t("app.filters.allSets") }].concat(data.sets.map((s) => ({ value: s.id, label: s.id })))} />
            <ToolBarSpacer />
            <span className="inline-flex items-center gap-2">
              <Toggle on={hideMissing} onChange={setHideMissing} ariaLabel={t("app.coleccion.hideMissing")} />
              <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-txt-muted">{t("app.coleccion.hideMissing")}</span>
            </span>
          </ToolBar>

          {groups.length === 0 ? (
            <Empty icon="search" title={t("app.empty.title")} lead={t("app.empty.lead")} />
          ) : groups.map(({ set, cards }) => (
            <CGroup key={set.id} set={set} cards={cards} effective={effective} editable={editable} hideMissing={hideMissing}
              onAdd={(c) => setChange(c.id, 1)} onRemove={(c) => setChange(c.id, -1)} onOpen={(c) => onOpenCard(c, data.cards)} />
          ))}
        </div>

        <div className="grid gap-5 xl:sticky xl:top-4">
          <BestPackPanel viewerName={viewerName} />
          <Panel title={t("app.panel.recentActivity")} aside={<Icon name="clock" size={15} />}>
            {recent.length === 0 ? (
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
                      <div className="min-w-0">
                        <div className="truncate text-[14px] leading-tight text-txt">{name}</div>
                        <div className="font-mono text-[11px] leading-none text-txt-dim">{card ? `${card.setId} · #${padNum(card.localId || card.id)}` : ""}</div>
                      </div>
                      <span className={"ml-auto font-mono text-[13px] font-bold " + (u.count > 0 ? "text-ok" : "text-bad")}>{u.count > 0 ? "+" : ""}{u.count}</span>
                      <span className="min-w-[72px] text-right font-mono text-[11px] leading-none text-txt-dim">{timeAgo(u.at, locale)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {editable && dirtyCount > 0 && (
        <div className="cut-corner cut-corner-edge [--cut-line:var(--accent-line)] fixed bottom-[22px] left-1/2 z-[120] flex -translate-x-1/2 items-center gap-[14px] border border-solid border-accent-line bg-panel py-[11px] pl-[18px] pr-3 shadow-2xl motion-safe:animate-[bm-toast-in_.24s_both]">
          <span className="text-[13px] leading-tight text-txt-muted">
            <b className="font-mono text-txt">{dirtyCount}</b> {t("app.coleccion.unsaved", { count: dirtyCount })}
          </span>
          <Button size="sm" variant="ghost" onClick={discard} disabled={saving}>{t("app.coleccion.discard")}</Button>
          <Button size="sm" variant="pri" icon="check" onClick={save} disabled={saving}>{saving ? t("app.coleccion.saving") : t("app.coleccion.saveChanges")}</Button>
        </div>
      )}
    </div>
  )
}
