"use client"

import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type ComponentType } from "react"
import type FlipBook from "react-pageflip"
import type { UserAchievement } from "@boffmedia/shared"
import { cn } from "@/lib/utils"
import {
  useAchievements,
  useLedger,
  useLogros,
  usePasaporteUuid,
  usePassportProfile,
  usePlayerStats,
  usePlayerTeam,
  useSeason,
} from "../_hooks/queries"
import { usePassportStore } from "../_stores/usePassportStore"
import type { ChapterAccent, PageDescriptor } from "../_types"
import { stampsFromHistory } from "../_utils/bitacora"
import { CHAPTERS, chapterInk, chapterVars } from "../_utils/chapters"
import { milestonesFromHistory } from "../_utils/cronica"
import { isEarned, isGym } from "../_utils/medals"
import { ChapterRail, type RailChapter } from "./ChapterRail"
import { Controls } from "./Controls"
import { ReplayModal } from "./ReplayModal"
import { BackCover } from "./chapters/BackCover"
import { BadgePage } from "./chapters/BadgePage"
import { Bitacora } from "./chapters/Bitacora"
import { Carne } from "./chapters/Carne"
import { Competiciones } from "./chapters/Competiciones"
import { Cover } from "./chapters/Cover"
import { Cronica } from "./chapters/Cronica"
import { Equipo } from "./chapters/Equipo"
import { Identidad } from "./chapters/Identidad"
import { Indice } from "./chapters/Indice"
import { LogrosColeccion, LogrosResumen } from "./chapters/Logros"
import { Medallas } from "./chapters/Medallas"
import { Temporada } from "./chapters/Temporada"
import { EmptyState, Folio, Paper, toast } from "./ui"

/**
 * StPageFlip measures the DOM on construction, so it cannot run on the server. It is loaded
 * here directly rather than through `@/components/shared/book` — that wrapper is
 * Boffmedia-styled and pulls in framer-motion and a stylesheet, neither of which belongs in
 * a SmartRotom app (§3, §6, §11).
 */
const HTMLFlipBook = dynamic(() => import("react-pageflip"), { ssr: false }) as ComponentType<
  ComponentProps<typeof FlipBook>
>

/** The bits of StPageFlip's instance the book actually drives. */
interface PageFlipApi {
  flip: (page: number, corner?: "top" | "bottom") => void
  flipNext: (corner?: "top" | "bottom") => void
  flipPrev: (corner?: "top" | "bottom") => void
}

const FLIP_MS = 900

/** The satin bookmark. A gild chapter keeps the document's own oxblood silk. */
function ribbonVars(accent: ChapterAccent) {
  if (accent === "gild") return undefined
  const ink = chapterInk(accent)
  return { "--ps-ribbon": ink.deep, "--ps-ribbon-hi": ink.accent } as Record<string, string>
}

const SILK = {
  background:
    "linear-gradient(180deg, rgb(var(--ps-ribbon-hi)), rgb(var(--ps-ribbon)) 55%, rgb(var(--ps-ribbon) / .55))",
  clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)",
}

export function PassportBook() {
  const t = useTranslations("pasaporte")
  const uuid = usePasaporteUuid()

  const profile = usePassportProfile(uuid)
  const stats = usePlayerStats(uuid)
  const team = usePlayerTeam(uuid)
  const achievements = useAchievements(uuid)
  const logros = useLogros(uuid)
  const season = useSeason(uuid)
  const ledger = useLedger(uuid)

  const inspect = usePassportStore((s) => s.inspect)
  const toggleInspect = usePassportStore((s) => s.toggleInspect)
  const motion = usePassportStore((s) => s.motion)
  const setStoredPage = usePassportStore((s) => s.setPage)

  // The page the reader left the book on. Read once: after that the book owns it, and
  // feeding the store's value back into `startPage` would fight every flip.
  const startPage = useRef(usePassportStore.getState().page)

  const flip = useRef<PageFlipApi | null>(null)
  const [page, setPage] = useState(startPage.current)
  const [visited, setVisited] = useState<Set<number>>(() => new Set([startPage.current]))
  const [replay, setReplay] = useState<UserAchievement | null>(null)

  const badges = useMemo(
    () => (achievements.data ?? []).filter((a) => isGym(a) && isEarned(a)),
    [achievements.data],
  )

  /**
   * The leaves, as a NAMED list. Every jump in the book resolves a key to an index through
   * this — the handoff's model — because index arithmetic over a list whose length depends
   * on how many badges the trainer has earned is how a book ends up flipping to the wrong
   * page for one player in ten.
   */
  const pages = useMemo<PageDescriptor[]>(() => {
    const list: PageDescriptor[] = [{ key: "cover", kind: "cover", accent: "gild", hard: true }]

    const push = (key: string, chapter: PageDescriptor["chapter"], accent: ChapterAccent, badgeId?: string) => {
      list.push({
        key,
        kind: badgeId ? "badge" : "chapter",
        chapter,
        accent,
        folio: String(list.length).padStart(2, "0"),
        ...(badgeId ? { badgeId } : {}),
      })
    }

    push("indice", "indice", "gild")
    push("identidad", "identidad", "oxblood")
    push("carne", "carne", "info")
    push("equipo", "equipo", "teal")
    push("medallas", "medallas", "olive")
    push("competiciones", "competiciones", "oxblood")
    push("temporada", "temporada", "gild")
    push("logros", "logros", "plum")
    push("logros:coleccion", "logros", "plum")

    for (const badge of badges) push(`badge:${badge.id}`, "insignias", "gild", badge.id)

    push("bitacora", "bitacora", "teal")
    push("cronica", "cronica", "plum")

    // Both boards stand alone — the front cover opens on its own and the back one closes on
    // its own — so the soft leaves between them have to pair up, which means the TOTAL count
    // must be even. An odd one takes a blank verso, inserted before the back board and never
    // after it. The count includes the covers: this is the one place index arithmetic is
    // unavoidable, and getting it wrong pairs the back board with a chapter.
    list.push({ key: "back", kind: "back", accent: "gild", hard: true })
    if (list.length % 2 !== 0) {
      const back = list.pop()!
      list.push({ key: "pad", kind: "pad", accent: "gild", folio: String(list.length).padStart(2, "0") })
      list.push(back)
    }

    return list
  }, [badges])

  const pageOf = useCallback(
    (key: string) => {
      const index = pages.findIndex((p) => p.key === key)
      return index < 0 ? 0 : index
    },
    [pages],
  )

  const flipTo = useCallback((target: number) => flip.current?.flip(target, "top"), [])
  const next = useCallback(() => flip.current?.flipNext("top"), [])
  const prev = useCallback(() => flip.current?.flipPrev("top"), [])

  const rail = useMemo<(RailChapter & { deep: string })[]>(() => {
    const entries = CHAPTERS.filter((c) => c.key !== "insignias" || badges.length > 0)
    return entries.map((c, i) => ({
      key: c.key,
      label: t(`chapters.${c.key}`),
      no: String(i + 1).padStart(2, "0"),
      page: pages.findIndex((p) => p.chapter === c.key),
      tab: c.tab,
      deep: c.deep,
    }))
  }, [badges.length, pages, t])

  const activeChapter = useMemo(() => {
    let active = -1
    rail.forEach((c, i) => {
      if (c.page >= 0 && page >= c.page) active = i
    })
    return active
  }, [rail, page])

  const onFlip = useCallback(
    (event: { data: number }) => {
      const target = event.data
      setPage(target)
      setStoredPage(target)
      setVisited((seen) => {
        if (seen.has(target)) return seen
        const copy = new Set(seen)
        copy.add(target)
        return copy
      })
    },
    [setStoredPage],
  )

  // Read inside the key handler, which is bound once — a ref keeps it current without
  // re-binding the listener on every open and close.
  const replayOpen = useRef(false)
  replayOpen.current = replay !== null

  // The whole keyboard surface. An input has priority over every one of these — a reader
  // typing "i" into a field is not asking for the inspection lamp.
  useEffect(() => {
    let sequence = ""

    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return

      if (event.key === "Escape") {
        setReplay(null)
        return
      }
      // While the replay sheet is open it owns the keyboard: the book behind it must not
      // turn under a modal.
      if (replayOpen.current) return

      if (event.key === "ArrowRight") next()
      else if (event.key === "ArrowLeft") prev()
      else if (event.key === "Home") flipTo(0)
      else if (event.key === "End") flipTo(pages.length - 1)
      else if (event.key.toLowerCase() === "i") toggleInspect()

      sequence = (sequence + (event.key.length === 1 ? event.key.toLowerCase() : "")).slice(-5)
      if (sequence === "rotom") {
        sequence = ""
        flipTo(0)
      }
    }

    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [flipTo, next, prev, pages.length, toggleInspect])

  // Inspection is announced: the officer's lamp coming on is a state change the reader must
  // see even if their eyes are on the paper, not on the button.
  const announced = useRef(inspect)
  useEffect(() => {
    if (inspect && !announced.current) toast(t("book.inspectToast"))
    announced.current = inspect
  }, [inspect, t])

  const stamps = useMemo(
    () => stampsFromHistory(achievements.data ?? [], ledger.data?.transactions ?? [], t),
    [achievements.data, ledger.data, t],
  )

  const milestones = useMemo(
    () => milestonesFromHistory(achievements.data ?? [], logros.data ?? [], profile.data, t),
    [achievements.data, logros.data, profile.data, t],
  )

  if (!uuid) {
    return (
      <main className="relative grid min-h-0 place-items-center px-4">
        <div className="w-[min(420px,92vw)] rounded-2xl border border-ps-gild/18 bg-ps-desk-lo/60 p-8">
          <EmptyState
            icon="idcard"
            title={t("book.emptyTitle")}
            sub={t("book.emptySub")}
            className="text-ps-chrome-muted [&_p]:text-ps-chrome-muted"
          />
        </div>
      </main>
    )
  }

  function body(descriptor: PageDescriptor) {
    switch (descriptor.chapter) {
      case "indice":
        return <Indice chapters={rail} onFlip={flipTo} />
      case "identidad":
        return (
          <Identidad
            profile={profile.data}
            stats={stats.data}
            loading={profile.isPending || stats.isPending}
            inspect={inspect}
          />
        )
      case "carne":
        return (
          <Carne
            profile={profile.data}
            stats={stats.data}
            loading={profile.isPending || stats.isPending}
            inspect={inspect}
          />
        )
      case "equipo":
        return <Equipo team={team.data} loading={team.isPending} />
      case "medallas":
        return (
          <Medallas
            achievements={achievements.data}
            loading={achievements.isPending}
            onOpenBadge={(id) => flipTo(pageOf(`badge:${id}`))}
          />
        )
      case "competiciones":
        return <Competiciones achievements={achievements.data} loading={achievements.isPending} />
      case "temporada":
        return <Temporada season={season.data} region={profile.data?.region} loading={season.isPending} />
      case "logros":
        return descriptor.key === "logros" ? (
          <LogrosResumen logros={logros.data} loading={logros.isPending} />
        ) : (
          <LogrosColeccion logros={logros.data} loading={logros.isPending} />
        )
      case "insignias": {
        const badge = badges.find((b) => b.id === descriptor.badgeId)
        if (!badge) return null
        return (
          <BadgePage
            achievement={badge}
            slam={page === pages.indexOf(descriptor) && motion === "on"}
            inspect={inspect}
            onReplay={setReplay}
          />
        )
      }
      case "bitacora":
        return (
          <Bitacora stamps={stamps} loading={achievements.isPending || ledger.isPending} />
        )
      case "cronica":
        return (
          <Cronica
            milestones={milestones}
            loading={achievements.isPending || logros.isPending || profile.isPending}
          />
        )
      default:
        return null
    }
  }

  const last = pages.length - 1
  const progress = last > 0 ? page / last : 0
  const closed = page <= 0 || page >= last
  const current = pages[Math.min(page, last)] ?? pages[0]

  // A closed book only fills HALF the spread — the front cover sits on the right leaf, the back
  // cover on the left — so leaving it where an open spread would be parks it against one edge with
  // a desk's worth of nothing beside it. Slide the whole block by a quarter of its width (half of
  // one leaf) and the closed passport sits centred on the counter, then slides back as it opens.
  const shut = page <= 0 ? "-25%" : page >= last ? "25%" : "0%"

  return (
    <>
      {/* The book is the only thing on the desk. The handoff framed it in a leather blotter,
          which cost it ~25% of its size for a prop nobody reads — so the stage is bare and the
          book takes the whole height it can get. The right padding matches the rail's gutter so
          the spread stays optically centred. */}
      <main className="relative grid min-h-0 place-items-center py-2 pl-4 pr-4 lg:pl-[92px] lg:pr-[92px]">
        <ChapterRail chapters={rail} active={activeChapter} onFlip={flipTo} />

        <div
          style={{ transform: `translateX(${shut})` }}
          className="relative z-[2] aspect-[9/5] h-full max-h-full w-auto max-w-full drop-shadow-[0_40px_90px_rgba(0,0,0,.7)] transition-transform duration-[600ms] ease-[cubic-bezier(.22,.9,.31,1)] motion-reduce:transition-none"
        >
          <div
            aria-hidden="true"
            style={{ left: `${22 + progress * 56}%`, opacity: closed ? 0 : 1, ...ribbonVars(current.accent) }}
            className="pointer-events-none absolute -top-2.5 z-[25] w-[30px] drop-shadow-[0_6px_6px_rgba(0,0,0,.4)] transition-[left,opacity,background] duration-500 motion-reduce:transition-none"
          >
            <div
              style={SILK}
              className="h-[92px] w-full shadow-[inset_-6px_0_8px_rgba(0,0,0,.25),inset_6px_0_6px_rgba(255,255,255,.18)]"
            />
          </div>

          <HTMLFlipBook
            key={pages.length}
            // StPageFlip's `stretch` sizing measures THIS element (`getBlockWidth/Height`),
            // and its own children are absolutely positioned — so without a definite height
            // it measures ~0 and the book comes out a postcard on a desk built for a folio.
            className="h-full w-full"
            style={{ width: "100%", height: "100%" }}
            width={460}
            height={510}
            size="stretch"
            minWidth={280}
            maxWidth={1000}
            minHeight={380}
            maxHeight={1100}
            startPage={Math.min(startPage.current, last)}
            startZIndex={0}
            autoSize={false}
            showCover
            usePortrait
            drawShadow
            maxShadowOpacity={0.45}
            // A flip cannot be 0ms — StPageFlip divides by it — so "off" is one tick: the
            // page turns instantly instead of not turning at all.
            flippingTime={motion === "off" ? 1 : FLIP_MS}
            useMouseEvents
            mobileScrollSupport
            swipeDistance={30}
            clickEventForward
            showPageCorners
            disableFlipByClick={false}
            onFlip={onFlip}
            onInit={(event: { object: PageFlipApi }) => {
              flip.current = event.object
            }}
          >
            {pages.map((descriptor, index) => {
              const side = index % 2 === 0 ? "right" : "left"
              // The stack of leaves under this one, stepping away from the spine. It is what
              // gives the passport thickness — without it every page reads as a loose sheet.
              const leaves = side === "right" ? "ps-leaves-r" : "ps-leaves-l"

              if (descriptor.kind === "cover") {
                return (
                  <div
                    key={descriptor.key}
                    data-density="hard"
                    className={cn("relative h-full w-full overflow-hidden", leaves)}
                  >
                    <Cover profile={profile.data} />
                  </div>
                )
              }
              if (descriptor.kind === "back") {
                return (
                  <div
                    key={descriptor.key}
                    data-density="hard"
                    className={cn("relative h-full w-full overflow-hidden", leaves)}
                  >
                    <BackCover />
                  </div>
                )
              }

              return (
                <div
                  key={descriptor.key}
                  data-density="soft"
                  style={chapterVars(descriptor.accent)}
                  className={cn("relative h-full w-full overflow-hidden bg-ps-paper", leaves)}
                >
                  <Paper side={side}>
                    {descriptor.kind === "pad" ? null : body(descriptor)}
                    {descriptor.folio && (
                      <Folio
                        side={side}
                        page={descriptor.folio}
                        onIndex={
                          descriptor.chapter === "indice" ? undefined : () => flipTo(pageOf("indice"))
                        }
                      />
                    )}
                  </Paper>
                </div>
              )
            })}
          </HTMLFlipBook>
        </div>
      </main>

      <Controls page={page} total={pages.length} visited={visited} onPrev={prev} onNext={next} onFlip={flipTo} />

      {replay && <ReplayModal achievement={replay} onClose={() => setReplay(null)} />}
    </>
  )
}
