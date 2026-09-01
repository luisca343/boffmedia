"use client"

import { useEffect, useState } from "react"

import { Icon, Spinner, Empty, SearchInput, ToolSeal, ToolStrip, ToolTitle, type IconName } from "@boffmedia/ui"
import { cn } from "@boffmedia/ui/cn"
import { TCGP_NS, useToolT } from "../i18n"
import type { TcgCard } from "./service"
import { useTcgpCards } from "./useTcgpCards"
import { useCollection } from "./useCollection"
import { TcgCardDrawer } from "./tcgp-kit"
import { PanelView } from "./PanelView"
import { CartasView } from "./CartasView"
import { ColeccionView } from "./ColeccionView"
import { SobresView } from "./SobresView"

export type TcgpView = "panel" | "cartas" | "coleccion" | "sobres"

const TABS: { key: TcgpView; icon: IconName }[] = [
  { key: "panel", icon: "home" },
  { key: "cartas", icon: "cards" },
  { key: "coleccion", icon: "grid" },
  { key: "sobres", icon: "inbox" },
]

export interface TcgpAppProps {
  /**
   * Which tab to show. Optional, and that is the whole host seam: apps/web has
   * a route per tab and passes the one the URL names, while the launcher has no
   * URLs and lets the component remember. A host that passes `view` must also
   * pass `onViewChange`, or the tabs will appear to do nothing.
   */
  view?: TcgpView
  onViewChange?: (view: TcgpView) => void
  /** sobres/[expansion] deep-link. */
  expansion?: string
  /** cartas/[...params] deep-link — open this card's drawer on load. */
  cardId?: string
  /** Prefilled card search (web's `?q=`). */
  query?: string
  /** Whose collection to show read-only (web's `?u=`). */
  galleryUser?: string | null
  /** Web pushes a route; the launcher swaps its own state. */
  onGalleryUserChange?: (user: string | null) => void
  /** Web pushes `?q=` onto the cards route. */
  onQueryChange?: (query: string) => void
}

export function TcgpApp({
  view: viewProp,
  onViewChange,
  expansion,
  cardId,
  query = "",
  galleryUser: galleryUserProp,
  onGalleryUserChange,
  onQueryChange,
}: TcgpAppProps) {
  const t = useToolT(TCGP_NS)
  // Uncontrolled by default. The launcher never passes `view`, so the tabs work
  // there with no routing at all; on the web the prop always wins.
  const [ownView, setOwnView] = useState<TcgpView>(viewProp ?? "panel")
  const [ownGalleryUser, setOwnGalleryUser] = useState<string | null>(null)
  const view = viewProp ?? ownView
  const galleryUser = view === "coleccion" ? (galleryUserProp ?? ownGalleryUser) : null

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

  const nav = (key: TcgpView) => {
    setOwnView(key)
    onViewChange?.(key)
  }
  const openCard = (card: TcgCard, list: TcgCard[]) => setDrawer({ card, list })
  const goGallery = (user: string) => {
    setOwnGalleryUser(user)
    setOwnView("coleccion")
    onGalleryUserChange?.(user)
    onViewChange?.("coleccion")
  }
  const submitSearch = () => {
    const q = search.trim()
    if (!q) return
    setOwnView("cartas")
    onViewChange?.("cartas")
    onQueryChange?.(q)
  }

  const drawerEditable = view === "coleccion" && !galleryUser && collection.editable

  return (
    // Single scroller: the page. A `100vh - nav` box with its own
    // `overflow-y-auto` body nests a second scrollbar inside a document that
    // still scrolls by exactly one Footer's height — scrolling down slides the
    // tool up and leaves the grid peeking through a sliver above the footer.
    <div className="flex min-w-0 flex-col">
      {/* section header — the shared ToolStrip, so this tool's bar is the same
          object (height, gutter, sticky offset, z-order) as every other one. */}
      {/* Two rows, one sticky context — `ToolStrip` owns both. The wrapper this
          used to hand-roll (and the `static` override that went with it) is now
          the primitive's job, so the tab row cannot scroll out from under the
          title here or anywhere else. */}
      <ToolStrip
        sub={
          <nav role="tablist" aria-label="TCG Pocket" className="-my-2 flex gap-[2px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((tab) => {
              const on = tab.key === view
              return (
                <button key={tab.key} role="tab" aria-selected={on} type="button" onClick={() => nav(tab.key)}
                  className={cn(
                    "inline-flex flex-none items-center gap-2 border-b-2 border-solid px-[15px] pb-[13px] pt-[11px] font-display text-[14px] font-bold uppercase leading-none tracking-[0.06em] transition-colors",
                    on ? "border-accent text-txt" : "border-transparent text-txt-muted hover:text-txt",
                  )}>
                  <Icon name={tab.icon} size={16} className={on ? "text-accent" : "text-txt-dim"} />
                  {t(`app.tabs.${tab.key}`)}
                </button>
              )
            })}
          </nav>
        }
      >
        <ToolSeal label="TCG" solid />
        <ToolTitle title="TCG Pocket" sub={<span className="max-[560px]:hidden">{t("app.tagline")}</span>} />
        <div className="ml-auto w-[min(320px,40vw)] max-[720px]:hidden">
          <SearchInput
            value={search}
            onChange={setSearch}
            onSubmit={submitSearch}
            placeholder={t("app.searchCards")}
            size="sm"
          />
        </div>
      </ToolStrip>

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
            <CartasView data={data} effective={collection.effective} initialQ={query || (view === "cartas" ? search.trim() : "")} onOpenCard={openCard} />
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
