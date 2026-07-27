"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { useBoffSession } from "@/services/useBoffSession"
import { useRotomUuid } from "@/components/smartrotom/behavior/useRotomUuid"
import { MapCanvas } from "./_components/map/MapCanvas"
import { DestinationsPanel } from "./_components/DestinationsPanel"
import { PassportPanel } from "./_components/PassportPanel"
import { SelectedCard } from "./_components/SelectedCard"
import { NavTabs, TopBar, type TaxiTab } from "./_components/TopBar"
import { ConfirmModal, InsufficientModal } from "./_components/flows/ConfirmModal"
import { TravelingOverlay } from "./_components/flows/TravelingOverlay"
import { WalletModal } from "./_components/flows/WalletModal"
import { ToastHost, toast } from "./_components/ui"
import { useBalance, useLedger, usePlayerPosition, useRegions, useStops, useTeleport } from "./_hooks/queries"
import { useEnrichedStops } from "./_hooks/useEnrichedStops"
import { useFavorites } from "./_hooks/useFavorites"
import { useReducedMotion, useViewportHeight, useWide } from "./_hooks/useMediaQuery"
import { travelStats, tripsFromTransactions } from "./_utils/trips"
import type { EnrichedStop } from "./_types"

type Flow = "idle" | "confirm" | "insufficient" | "traveling"

/** How much of the map the mobile sheet covers — the map centres above it. */
const SHEET_RATIO = 0.46

export default function TaxiPage() {
  const t = useTranslations("taxi")
  const { session } = useBoffSession()
  const uuid = useRotomUuid() ?? undefined
  const playerName = session?.user?.name ?? t("playerFallback")

  const stopsQuery = useStops()
  const regionsQuery = useRegions()
  const positionQuery = usePlayerPosition()
  const balanceQuery = useBalance(uuid)
  const ledgerQuery = useLedger(uuid)
  const teleport = useTeleport(uuid)

  const wide = useWide()
  const reduceMotion = useReducedMotion()
  const viewportHeight = useViewportHeight()
  const { favorites, toggle: toggleFavorite } = useFavorites()

  const [tab, setTab] = useState<TaxiTab>("go")
  const [selected, setSelected] = useState<EnrichedStop | null>(null)
  const [flow, setFlow] = useState<Flow>("idle")
  const [walletOpen, setWalletOpen] = useState(false)
  const [sheetFull, setSheetFull] = useState(false)
  const [recenterSignal, setRecenterSignal] = useState(0)

  const player = positionQuery.data ?? { x: 0, z: 0 }
  const balance = balanceQuery.data
  const transactions = useMemo(() => ledgerQuery.data?.transactions ?? [], [ledgerQuery.data])

  const stops = useEnrichedStops(stopsQuery.data ?? [], player, regionsQuery.data ?? [])

  // The passport and the "recientes" rail are the same ledger read, seen two ways.
  const trips = useMemo(() => tripsFromTransactions(transactions), [transactions])
  const stats = useMemo(() => travelStats(trips), [trips])

  // The map is stale about the selected stop's fare the moment the player moves, so the
  // selection is held by id and re-read from the live list.
  const selectedLive = useMemo(
    () => (selected ? (stops.find((s) => s.id === selected.id) ?? selected) : null),
    [selected, stops],
  )

  useEffect(() => {
    if (stopsQuery.isError) toast.error(t("loadStopsError"))
  }, [stopsQuery.isError])

  const onSelect = useCallback(
    (stop: EnrichedStop) => {
      setSelected(stop)
      setTab("go")
      if (!wide) setSheetFull(false)
    },
    [wide],
  )

  const onTravel = useCallback(
    (stop: EnrichedStop) => {
      if (balance === undefined) return
      setSelected(stop)
      setFlow(balance < stop.price ? "insufficient" : "confirm")
    },
    [balance],
  )

  const onConfirm = useCallback(() => {
    if (!selectedLive || teleport.isPending) return
    const stop = selectedLive
    setFlow("traveling")
    teleport.mutate(
      { stop, price: stop.price },
      {
        onSuccess: () => {
          setFlow("idle")
          setSelected(null)
          setRecenterSignal((n) => n + 1)
          toast.success(
            t.rich("arrived", {
              name: stop.id,
              b: (chunks) => <strong>{chunks}</strong>,
            }),
          )
        },
        onError: (error) => {
          setFlow("idle")
          toast.error(error instanceof Error ? error.message : t("errors.tripFailed"))
        },
      },
    )
  }, [selectedLive, teleport])

  const openWallet = useCallback(() => {
    setFlow("idle")
    setWalletOpen(true)
  }, [])

  const panel = (
    <div className="flex h-full min-h-0 flex-col">
      <NavTabs tab={tab} onChange={setTab} />
      {tab === "go" ? (
        <DestinationsPanel
          stops={stops}
          balance={balance}
          selected={selectedLive}
          favorites={favorites}
          recents={stats.recents}
          onSelect={onSelect}
          onToggleFavorite={toggleFavorite}
        />
      ) : (
        <PassportPanel
          stops={stops}
          trips={trips}
          stats={stats}
          loading={ledgerQuery.isLoading || stopsQuery.isLoading}
        />
      )}
    </div>
  )

  const card = selectedLive && (
    <SelectedCard
      stop={selectedLive}
      balance={balance}
      favorite={favorites.includes(selectedLive.id)}
      onToggleFavorite={toggleFavorite}
      onTravel={onTravel}
      onTopUp={openWallet}
      onClose={() => setSelected(null)}
      onRecenter={() => setRecenterSignal((n) => n + 1)}
      bare={!wide}
    />
  )

  // On a phone the sheet sits over the map, so the camera's centre has to rise above it.
  const bottomInset = wide ? 0 : Math.round(viewportHeight * SHEET_RATIO)

  return (
    <>
      <TopBar
        balance={balance}
        loadingBalance={balanceQuery.isLoading}
        playerName={playerName}
        onWallet={openWallet}
        onProfile={() => {
          setSelected(null)
          setTab("pass")
          if (!wide) setSheetFull(true)
        }}
      />

      <div className={`relative flex min-h-0 flex-1 overflow-hidden ${wide ? "flex-row" : "flex-col"}`}>
        <div className="relative min-h-0 min-w-0 flex-1">
          <MapCanvas
            stops={stops}
            regions={regionsQuery.data ?? []}
            player={player}
            selected={selectedLive}
            onSelect={onSelect}
            reduceMotion={reduceMotion}
            bottomInset={bottomInset}
            recenterSignal={recenterSignal}
          >
            {wide && card && <div className="absolute bottom-[18px] left-[18px] z-[25] w-[380px] max-w-[calc(100%-90px)]">{card}</div>}
          </MapCanvas>
        </div>

        {wide ? (
          <aside className="z-[12] flex w-[404px] shrink-0 flex-col border-l border-solid border-tx-line bg-tx-bg-1/80 backdrop-blur-[20px]">
            {panel}
          </aside>
        ) : (
          <div
            className="absolute inset-x-0 bottom-0 z-[26] flex flex-col rounded-t-[24px] border-t border-solid border-tx-line-2 bg-tx-bg-1/95 shadow-[0_-16px_50px_rgb(0_0_0/0.4)] backdrop-blur-[24px] transition-[height] duration-[400ms] ease-tx"
            style={{ height: selectedLive ? "auto" : sheetFull ? "86vh" : "46vh", maxHeight: "88vh" }}
          >
            <button
              type="button"
              onClick={() => setSheetFull((f) => !f)}
              aria-label={sheetFull ? "Contraer panel" : "Expandir panel"}
              className="grid shrink-0 place-items-center px-0 pb-1.5 pt-2.5"
            >
              <span className="h-[5px] w-[42px] rounded-[3px] bg-tx-line-2" />
            </button>
            {selectedLive ? (
              <div className="tx-scroll max-h-[86vh] overflow-y-auto px-3.5 pb-4">{card}</div>
            ) : (
              <div className="flex min-h-0 flex-1">
                <div className="w-full">{panel}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {walletOpen && (
        <WalletModal
          balance={balance}
          transactions={transactions}
          accountIds={ledgerQuery.data?.accountIds ?? []}
          loading={ledgerQuery.isLoading || balanceQuery.isLoading}
          playerName={playerName}
          onClose={() => setWalletOpen(false)}
        />
      )}

      {flow === "confirm" && selectedLive && balance !== undefined && (
        <ConfirmModal
          stop={selectedLive}
          player={player}
          balance={balance}
          pending={teleport.isPending}
          onConfirm={onConfirm}
          onCancel={() => setFlow("idle")}
        />
      )}

      {flow === "insufficient" && selectedLive && balance !== undefined && (
        <InsufficientModal
          stop={selectedLive}
          price={selectedLive.price}
          balance={balance}
          onClose={() => setFlow("idle")}
          onTopUp={openWallet}
        />
      )}

      {flow === "traveling" && selectedLive && (
        <TravelingOverlay stopId={selectedLive.id} reduceMotion={reduceMotion} />
      )}

      <ToastHost />
    </>
  )
}
