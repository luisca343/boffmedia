"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { userMessageFrom } from "@/services/boffAPI"
import PlayOnMountAudio from "@/components/shared/PlayOnMountAudio"
import { BootScreen } from "./_components/BootScreen"
import { BoxOverview } from "./_components/BoxOverview"
import { BoxRail } from "./_components/BoxRail"
import { BulkBar } from "./_components/BulkBar"
import { CommandPalette } from "./_components/CommandPalette"
import { CompareTray } from "./_components/CompareTray"
import { ErrorOverlay } from "./_components/ErrorOverlay"
import { FilterPanel } from "./_components/FilterPanel"
import { HelpModal } from "./_components/HelpModal"
import { LivingDex } from "./_components/LivingDex"
import { PCBoard } from "./_components/PCBoard"
import { PokemonDetail } from "./_components/PokemonDetail"
import { ShareBox } from "./_components/ShareBox"
import { SidePanel } from "./_components/SidePanel"
import { SmartViewsBar } from "./_components/SmartViewsBar"
import { Topbar } from "./_components/Topbar"
import { ToastHost, toast } from "./_components/ui"
import { useBoxGrid, useCanMove, useMons, useMovePokemon } from "./_hooks/queries"
import { DragProvider } from "./_hooks/useDrag"
import { planBulkMove, useMoveQueue } from "./_hooks/useMoveQueue"
import { usePcUi } from "./_stores/pcUiStore"
import type { Mon, SlotLoc } from "./_types/pc.types"

type OverlayKind = "filters" | "palette" | "help" | "overview" | "livingdex" | "share"

/**
 * The PC is a single stage with a rail on each side. This page owns three things and
 * nothing else: which overlay is open, the global keyboard map, and the drag layer's
 * three callbacks — everything visible is a section component.
 */
export default function PCPage() {
  const t = useTranslations("pc")
  const [overlay, setOverlay] = useState<OverlayKind | null>(null)
  const [shareBox, setShareBox] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)

  const { mons, isLoading, error } = useMons()
  const boxes = useBoxGrid(mons)
  const move = useMovePokemon()
  const canMove = useCanMove()
  const { run, isRunning } = useMoveQueue()

  const activeBox = usePcUi((s) => s.activeBox)
  const multiMode = usePcUi((s) => s.multiMode)
  const detail = usePcUi((s) => s.detail)
  const sound = usePcUi((s) => s.sound)
  const setDetail = usePcUi((s) => s.setDetail)
  const setMultiMode = usePcUi((s) => s.setMultiMode)
  const toggleDual = usePcUi((s) => s.toggleDual)

  const openShare = useCallback((box: number) => {
    setShareBox(box)
    setOverlay("share")
  }, [])

  // The drag layer addresses slots by position; resolving one back to a Pokémon is the
  // one thing it cannot do for itself.
  const monAt = useCallback(
    (loc: SlotLoc): Mon | null => {
      if (loc.kind === "party") {
        return mons.find((m) => m.loc.kind === "party" && m.loc.index === loc.index) ?? null
      }
      return boxes[loc.box ?? 0]?.[loc.index] ?? null
    },
    [boxes, mons],
  )

  const onDropSingle = useCallback(
    (from: SlotLoc, to: SlotLoc) => {
      if (move.isPending) return
      move.mutate({ from, to })
    },
    [move],
  )

  // Dropping a whole selection into a box is N real `/pc/move` calls — there is no
  // batch endpoint — so the queue issues them in order and reports what actually landed.
  const onDropMany = useCallback(
    async (items: Mon[], box: number) => {
      if (isRunning) return
      const { moves, placed, overflow } = planBulkMove(items, box, boxes[box] ?? [])
      if (moves.length === 0) {
        toast(overflow > 0 ? t("toast.boxFull") : t("toast.alreadyInBox"), "info")
        return
      }
      if (await run(moves, t("boot.loading"))) {
        toast(
          overflow > 0 ? t("toast.movedOverflow", { count: placed, overflow }) : t("toast.moved", { count: placed }),
          overflow > 0 ? "info" : "success",
        )
      }
    },
    [boxes, run, isRunning],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase() ?? ""
      const typing = tag === "input" || tag === "textarea" || tag === "select"

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOverlay((o) => (o === "palette" ? null : "palette"))
        return
      }

      // Every overlay sits on the shared scrim, which closes itself on Escape. So this
      // handler only has to unwind the two states that are *not* overlays.
      if (e.key === "Escape" && !overlay) {
        if (detail) setDetail(null)
        else if (multiMode) setMultiMode(false)
        return
      }
      if (typing || overlay) return

      switch (e.key.toLowerCase()) {
        case "/":
          e.preventDefault()
          searchRef.current?.focus()
          break
        case "f":
          e.preventDefault()
          setOverlay("filters")
          break
        case "m":
          setMultiMode(!multiMode)
          break
        case "d":
          toggleDual()
          break
        case "g":
          setOverlay("overview")
          break
        case "?":
          setOverlay("help")
          break
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [detail, multiMode, overlay, setDetail, setMultiMode, toggleDual])

  if (error) {
    return (
      <ErrorOverlay
        message={userMessageFrom(error, t("error.retry"))}
        onRetry={() => window.location.reload()}
      />
    )
  }

  return (
    <DragProvider monAt={monAt} onDropSingle={onDropSingle} onDropMany={onDropMany} validate={canMove}>
      {/* The directory is `apps/PC`, capitalised. The legacy page asked for `apps/pc`
          and had been silently 404ing on any case-sensitive filesystem. */}
      {sound && <PlayOnMountAudio src="/smartrotom/audio/apps/PC/TURN_ON.wav" volume={0.4} />}

      <div className="flex h-full min-h-0 flex-col gap-3 p-3.5">
        <Topbar
          searchRef={searchRef}
          onOpenFilters={() => setOverlay("filters")}
          onOpenLivingDex={() => setOverlay("livingdex")}
          onOpenPalette={() => setOverlay("palette")}
          onOpenHelp={() => setOverlay("help")}
        />
        <SmartViewsBar />
        <div className="flex min-h-0 flex-1 gap-3">
          <BoxRail onOverview={() => setOverlay("overview")} />
          <PCBoard onOpenFilters={() => setOverlay("filters")} onShareBox={openShare} />
          <SidePanel onOpenLivingDex={() => setOverlay("livingdex")} />
        </div>
      </div>

      {overlay === "filters" && <FilterPanel onClose={() => setOverlay(null)} />}
      {overlay === "overview" && <BoxOverview onClose={() => setOverlay(null)} />}
      {overlay === "livingdex" && <LivingDex onClose={() => setOverlay(null)} />}
      {overlay === "help" && <HelpModal onClose={() => setOverlay(null)} />}
      {overlay === "share" && <ShareBox box={shareBox} onClose={() => setOverlay(null)} />}
      {overlay === "palette" && (
        <CommandPalette
          onClose={() => setOverlay(null)}
          onOpenFilters={() => setOverlay("filters")}
          onOpenLivingDex={() => setOverlay("livingdex")}
          onOpenOverview={() => setOverlay("overview")}
          onOpenShare={() => openShare(activeBox)}
        />
      )}

      {detail && <PokemonDetail />}
      <CompareTray />
      <BulkBar />

      {isLoading && <BootScreen />}
      <ToastHost />
    </DragProvider>
  )
}
