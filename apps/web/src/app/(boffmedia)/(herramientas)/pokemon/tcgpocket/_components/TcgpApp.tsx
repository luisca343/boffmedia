"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Icon, Spinner, Empty, type IconName } from "@boffmedia/ui"
import { cn } from "@/lib/utils"
import type { TcgCard } from "@boffmedia/shared"
import { useTcgpCards } from "../_lib/useTcgpCards"
import { useCollection } from "../_lib/useCollection"
import { TcgCardDrawer } from "./tcgp-kit"
import { PanelView } from "./PanelView"
import { CartasView } from "./CartasView"
import { ColeccionView } from "./ColeccionView"
import { SobresView } from "./SobresView"

export type TcgpView = "panel" | "cartas" | "coleccion" | "sobres"

const BASE = "/pokemon/tcgpocket"
const ROUTES: Record<TcgpView, string> = {
  panel: BASE,
  cartas: `${BASE}/cartas`,
  coleccion: `${BASE}/coleccion`,
  sobres: `${BASE}/sobres`,
}
const TABS: { key: TcgpView; icon: IconName }[] = [
  { key: "panel", icon: "home" },
  { key: "cartas", icon: "cards" },
  { key: "coleccion", icon: "grid" },
  { key: "sobres", icon: "inbox" },
]

interface Props {
  view: TcgpView
  /** sobres/[expansion] deep-link. */
  expansion?: string
  /** cartas/[...params] deep-link — open this card's drawer on load. */
  cardId?: string
}

export function TcgpApp({ view, expansion, cardId }: Props) {
  const t = useTranslations("tcgpocket")
  const router = useRouter()
  const searchParams = useSearchParams()
  const galleryUser = view === "coleccion" ? searchParams.get("u") : null

  const { data, loading, error } = useTcgpCards()
  const collection = useCollection({ username: galleryUser || undefined, byId: data?.byId })

  const [drawer, setDrawer] = useState<{ card: TcgCard; list: TcgCard[] } | null>(null)
  const [search, setSearch] = useState("")

  // Close the drawer whenever the view/gallery changes.
  useEffect(() => { setDrawer(null) }, [view, galleryUser])

  // Deep-link: open the requested card once data is available.
  useEffect(() => {
    if (cardId && data?.byId[cardId]) setDrawer({ card: data.byId[cardId], list: data.cards })
  }, [cardId, data])

  const nav = (key: TcgpView) => router.push(ROUTES[key])
  const openCard = (card: TcgCard, list: TcgCard[]) => setDrawer({ card, list })
  const goGallery = (user: string) => router.push(`${ROUTES.coleccion}?u=${encodeURIComponent(user)}`)
  const submitSearch = () => { if (search.trim()) router.push(`${ROUTES.cartas}?q=${encodeURIComponent(search.trim())}`) }

  const drawerEditable = view === "coleccion" && !galleryUser && collection.editable

  return (
    // Single scroller: the page. This used to be a `100vh - nav` box with its own
    // `overflow-y-auto` body, which nested a second scrollbar inside a document
    // that still scrolled by exactly one Footer's height — so scrolling down slid
    // the tool up and left the grid peeking through a sliver above the footer.
    <div className="flex min-w-0 flex-col">
      {/* section header — sticks directly under the sticky site Navbar */}
      <header className="sticky top-[var(--nav-h)] z-20 flex-none border-b border-solid border-line bg-base/90 backdrop-blur-[10px]">
        <div className="flex items-center gap-4 px-[clamp(16px,3vw,34px)] py-[14px]">
          <div className="flex items-center gap-3">
            <span className="cut grid h-10 w-10 flex-none place-items-center bg-accent font-display text-[15px] font-bold tracking-[0.02em] text-accent-ink">TCG</span>
            <span className="flex flex-col leading-none">
              <b className="font-display text-[20px] font-bold uppercase leading-none tracking-[0.03em] text-txt">TCG Pocket</b>
              <small className="mt-1 font-mono text-[11px] uppercase leading-tight tracking-[0.1em] text-txt-dim max-[560px]:hidden">{t("app.tagline")}</small>
            </span>
          </div>
          <div className="ml-auto w-[min(320px,40vw)] max-[720px]:hidden">
            <label className="flex items-center gap-2 border border-solid border-line-2 bg-panel px-3 py-2">
              <Icon name="search" size={18} className="text-txt-dim" />
              <input className="w-full bg-transparent font-body text-[14px] text-txt outline-none placeholder:text-txt-dim"
                placeholder={t("app.searchCards")} value={search}
                onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submitSearch() }} />
            </label>
          </div>
        </div>
        <nav role="tablist" aria-label="TCG Pocket" className="flex gap-[2px] overflow-x-auto px-[clamp(16px,3vw,34px)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => {
            const on = tab.key === view
            return (
              <button key={tab.key} role="tab" aria-selected={on} type="button" onClick={() => nav(tab.key)}
                className={cn(
                  "inline-flex flex-none items-center gap-2 border-b-2 border-solid px-[15px] pb-[15px] pt-[13px] font-display text-[14px] font-bold uppercase leading-none tracking-[0.06em] transition-colors",
                  on ? "border-accent text-txt" : "border-transparent text-txt-muted hover:text-txt",
                )}>
                <Icon name={tab.icon} size={16} className={on ? "text-accent" : "text-txt-dim"} />
                {t(`app.tabs.${tab.key}`)}
              </button>
            )
          })}
        </nav>
      </header>

      {/* body */}
      <div>
        <div className="mx-auto w-full max-w-[1400px] p-[clamp(18px,3vw,34px)]">
          {loading ? (
            <div className="grid min-h-[40vh] place-items-center"><Spinner /></div>
          ) : error || !data ? (
            <div className="grid min-h-[40vh] place-items-center">
              <Empty icon="alert" title={t("app.errorTitle")} lead={t("app.errorLead")} />
            </div>
          ) : view === "cartas" ? (
            <CartasView data={data} effective={collection.effective} initialQ={searchParams.get("q") || ""} onOpenCard={openCard} />
          ) : view === "coleccion" ? (
            <ColeccionView data={data} collection={collection} username={galleryUser} onOpenCard={openCard} />
          ) : view === "sobres" ? (
            <SobresView data={data} effective={collection.effective} initialSetId={expansion} onOpenCard={openCard} />
          ) : (
            <PanelView data={data} owned={collection.owned} effective={collection.effective} recent={collection.recent}
              loggedIn={collection.loggedIn} go={nav} onGallery={goGallery} />
          )}
        </div>
      </div>

      {drawer && (
        <TcgCardDrawer
          card={drawer.card} list={drawer.list} count={collection.effective(drawer.card.id)}
          editable={drawerEditable}
          labels={{
            prev: t("app.drawer.prev"), next: t("app.drawer.next"), close: t("app.drawer.close"),
            inCollection: t("app.drawer.inCollection"), owned: t("app.drawer.owned"), notOwned: t("app.drawer.notOwned"),
            number: t("app.drawer.number"), expansion: t("app.drawer.expansion"), type: t("app.drawer.type"),
            hp: t("app.drawer.hp"), weakness: t("app.drawer.weakness"), retreat: t("app.drawer.retreat"),
            availableIn: t("app.drawer.availableIn"), illustrator: t("app.drawer.illustrator"),
          }}
          onAdd={(c) => collection.setChange(c.id, 1)}
          onRemove={(c) => collection.setChange(c.id, -1)}
          onNav={(c) => setDrawer((d) => (d ? { ...d, card: c } : d))}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  )
}
