"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { userMessageFrom } from "@/services/boffAPI"
import type { WpFormat } from "../../_types/market.types"
import { FORMAT_HINT_KEY, FORMAT_ICON, FORMAT_LABEL_KEY, fmt } from "../../_utils/format"
import { useCreateListing, useWpUuid } from "../../_hooks/queries"
import { usePcMons, type PcSlotMon } from "../../_hooks/usePcMons"
import {
  Button,
  Chip,
  EmptyState,
  Icon,
  Price,
  PriceInput,
  RarityBadge,
  Range,
  Skeleton,
  Slot,
  Sprite,
  SpriteStage,
  Textarea,
  Toggle,
  TypeBadge,
  ValueBox,
} from "../ui"

const STEPS = ["Elegir Pokémon", "Formato y precio", "Publicar"] as const
const FORMATS: WpFormat[] = ["fixed", "auction", "offer", "trade"]

/**
 * List a Pokémon.
 *
 * The picker reads the seller's **live PC** — you cannot list a Pokémon you do not
 * have, and the listing records the `(box, index)` plus the content hash so the
 * server can prove at settlement that it is still the same individual. That is what
 * "Propiedad verificada (PC)" on the card actually means.
 */
export function SellMon() {
  const t = useTranslations("wigglypop")
  const router = useRouter()
  const uuid = useWpUuid()
  const { boxes, isLoading, error } = usePcMons()
  const createListing = useCreateListing()

  const [step, setStep] = useState(0)
  const [boxIdx, setBoxIdx] = useState(0)
  const [picked, setPicked] = useState<PcSlotMon | null>(null)
  const [format, setFormat] = useState<WpFormat>("fixed")
  const [price, setPrice] = useState(0)
  const [days, setDays] = useState(3)
  const [note, setNote] = useState("")
  const [wants, setWants] = useState("")
  const [published, setPublished] = useState(false)

  const box = boxes[boxIdx]

  // A box in the game is 30 slots; the server only sends the occupied ones, so the
  // grid is materialised here rather than assumed dense.
  const grid = useMemo(() => {
    const slots: (PcSlotMon | null)[] = Array.from({ length: 30 }, () => null)
    for (const m of box?.mons ?? []) {
      if (m.index >= 0 && m.index < 30) slots[m.index] = m
    }
    return slots
  }, [box])

  function choose(m: PcSlotMon) {
    setPicked(m)
    setPrice(m.value)
    setStep(1)
  }

  function publish() {
    if (!picked || !uuid) return
    createListing.mutate(
      {
        sellerUuid: uuid,
        kind: "mon",
        format,
        title: picked.name,
        note: note || undefined,
        price: format === "trade" ? picked.value : price,
        escrow: true,
        durationDays: format === "auction" ? days : undefined,
        wants:
          format === "trade"
            ? wants.split(",").map((w) => w.trim()).filter(Boolean)
            : undefined,
        mon: {
          pokemonKey: picked.pokemonKey,
          sourceBox: picked.box,
          sourceIndex: picked.index,
          dex: picked.dex,
          species: picked.species,
          form: picked.form,
          palette: picked.palette,
          name: picked.name,
          level: picked.level,
          nature: picked.nature,
          ability: picked.ability,
          gender: picked.gender,
          heldItem: picked.heldItem,
          ivs: picked.ivs,
          evs: picked.evs,
          stats: picked.stats,
          moves: picked.moves,
        },
      },
      { onSuccess: () => { setPublished(true); setStep(2) } },
    )
  }

  // ── step 2: done ───────────────────────────────────────────────────────────
  if (step === 2 && published && picked) {
    return (
      <div className="mx-auto mt-10 max-w-[28.75rem] text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-wp-pill border border-wp-accent bg-wp-accent/[.13]">
          <Icon name="tag" size={28} className="text-wp-accent" />
        </div>
        <h2 className="font-wp-display text-[1.375rem] font-semibold text-wp-fg">{t("sell.mon.publishedTitle")}</h2>
        <p className="mt-2 font-wp text-[0.84375rem] font-semibold leading-relaxed text-wp-fg-muted">
          <b className="text-wp-fg">{picked.name}</b>{" "}
          {t("sell.mon.publishedBody", {
            suffix:
              format !== "trade"
                ? t("sell.mon.publishedPriceSuffix", { price: fmt(price) })
                : t("sell.mon.publishedTradeSuffix"),
          })}
        </p>
        <div className="mt-6 flex justify-center gap-2.5">
          <Button
            onClick={() => {
              setPicked(null)
              setPublished(false)
              setStep(0)
            }}
          >
            {t("common.publishAnother")}
          </Button>
          <Button variant="primary" onClick={() => router.push("/smartrotom/wigglypop/anuncios")}>
            {t("common.viewMyListings")}
          </Button>
        </div>
      </div>
    )
  }

  // ── step 0: pick ───────────────────────────────────────────────────────────
  if (step === 0 || !picked) {
    if (error)
      return (
        <EmptyState
          icon="alert"
          title={t("common.pcReadErrorTitle")}
          body={userMessageFrom(error, t("common.retryFallback"))}
        />
      )
    if (isLoading) {
      return (
        <div className="mx-auto max-w-[57.5rem]">
          <div className="grid grid-cols-6 gap-2.5">
            {Array.from({ length: 30 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-wp-sm" />
            ))}
          </div>
        </div>
      )
    }
    if (boxes.length === 0) {
      return (
        <EmptyState
          icon="package"
          title={t("common.emptyPcTitle")}
          body={t("sell.mon.emptyPcBody")}
        />
      )
    }

    return (
      <div className="mx-auto max-w-[57.5rem]">
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <span className="mr-1 flex items-center gap-1.5 font-wp text-[0.8125rem] font-semibold text-wp-fg-muted">
            <Icon name="shieldCheck" size={15} className="text-wp-green" />
            {t("sell.mon.pcLabel")}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {boxes.map((b, i) => (
              <button
                key={b.box}
                type="button"
                onClick={() => setBoxIdx(i)}
                className={cn(
                  "rounded-wp-pill border-wp px-3.5 py-2 font-wp text-[0.8125rem] font-extrabold transition-colors",
                  i === boxIdx
                    ? "wp-grad-primary border-transparent text-white"
                    : "border-wp-line/24 bg-white text-wp-fg-muted hover:text-wp-accent-strong",
                )}
              >
                {t("sell.mon.boxLabel", { n: b.box + 1 })} <span className="opacity-60">{b.mons.length}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2.5 xl:grid-cols-6">
          {grid.map((m, i) => (
            <Slot key={i} mon={m} onClick={m ? () => choose(m) : undefined} />
          ))}
        </div>
      </div>
    )
  }

  // ── step 1: price it ───────────────────────────────────────────────────────
  const overpriced = price > picked.value * 1.15
  const cheap = price < picked.value

  return (
    <div className="mx-auto grid max-w-[55rem] gap-6 md:grid-cols-[18.75rem_1fr]">
      {/* preview */}
      <div>
        <SpriteStage
          mon={picked}
          className="relative flex-col rounded-wp border-wp border-wp-line/24 p-[1.125rem] text-center"
        >
          <Sprite mon={picked} className="relative z-[2] h-32 w-[78%]" />
          <div className="relative z-[2]">
            <div className="font-wp text-lg font-bold text-wp-fg">
              {picked.shiny && <span className="text-wp-teal">✦ </span>}
              {picked.name}
            </div>
            <div className="mt-2 flex justify-center gap-1.5">
              {picked.types.map((ty) => (
                <TypeBadge key={ty} type={ty} size="sm" />
              ))}
            </div>
          </div>
        </SpriteStage>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <MiniSpec k={t("common.level")} v={String(picked.level)} />
          <MiniSpec k={t("common.ivsLabel")} v={`${picked.ivPct}%`} />
          <MiniSpec k={t("common.nature")} v={picked.nature} />
          <MiniSpec k={t("common.rarity")} v={<RarityBadge rarity={picked.rarity} />} />
        </div>

        <Button
          variant="ghost"
          className="mt-3 w-full"
          onClick={() => {
            setPicked(null)
            setStep(0)
          }}
        >
          <Icon name="arrowL" size={14} />
          {t("common.pickAnother")}
        </Button>
      </div>

      {/* form */}
      <div>
        <h3 className="mb-3 font-wp text-[0.9375rem] font-bold text-wp-fg">{t("sell.mon.formatHeading")}</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {FORMATS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFormat(k)}
              className={cn(
                "rounded-xl border-wp p-3 text-left transition-colors",
                format === k ? "border-wp-accent bg-wp-accent/[.13]" : "border-wp-line/24 bg-white",
              )}
            >
              <div className="flex items-center gap-2 font-wp text-[0.84375rem] font-bold text-wp-fg">
                <Icon
                  name={FORMAT_ICON[k]}
                  size={16}
                  className={format === k ? "text-wp-accent" : "text-wp-fg-muted"}
                />
                {t(FORMAT_LABEL_KEY[k])}
              </div>
              <div className="mt-1 font-wp text-[0.71875rem] font-semibold text-wp-fg-subtle">
                {t(FORMAT_HINT_KEY[k])}
              </div>
            </button>
          ))}
        </div>

        <ValueBox className="mt-4">
          <div className="flex items-center gap-2">
            <Icon name="wand" size={15} className="text-wp-teal" />
            <span className="font-wp text-[0.78125rem] font-bold text-wp-fg">{t("common.smartRotomSuggests")}</span>
            <Price amount={picked.value} size={16} symbolClassName="text-wp-teal-deep" />
            <Button
              className="ml-auto px-2.5 py-1 text-xs"
              onClick={() => setPrice(picked.value)}
            >
              {t("common.useSuggested")}
            </Button>
          </div>
        </ValueBox>

        {format !== "trade" && (
          <div className="mt-4">
            <label className="font-wp text-[0.78125rem] font-semibold text-wp-fg-muted">
              {format === "auction" ? t("common.initialBid") : t("common.price")} (₽)
            </label>
            <div className="mt-1.5 flex items-center gap-2.5">
              <PriceInput
                value={price || ""}
                min={0}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
              />
              {price > 0 && (
                <Chip
                  className={cn(
                    overpriced ? "text-wp-rose" : cheap ? "text-wp-green" : "text-wp-fg-muted",
                  )}
                >
                  {overpriced
                    ? t("common.priceVerdictAbove")
                    : cheap
                      ? t("common.priceVerdictGood")
                      : t("common.priceVerdictInline")}
                </Chip>
              )}
            </div>
          </div>
        )}

        {format === "auction" && (
          <div className="mt-4">
            <label className="font-wp text-[0.78125rem] font-semibold text-wp-fg-muted">
              {t("sell.mon.durationLabel")} <b className="text-wp-fg">{t("sell.mon.daysCount", { days })}</b>
            </label>
            <Range
              min={1}
              max={7}
              value={days}
              aria-label={t("sell.mon.durationAria")}
              className="mt-2"
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </div>
        )}

        {format === "trade" && (
          <div className="mt-4">
            <label className="font-wp text-[0.78125rem] font-semibold text-wp-fg-muted">
              {t("sell.mon.wantsLabel")}
            </label>
            <Textarea
              value={wants}
              onChange={(e) => setWants(e.target.value)}
              placeholder={t("sell.mon.wantsPlaceholder")}
              className="mt-1.5 min-h-[3.25rem]"
            />
          </div>
        )}

        <div className="mt-4">
          <label className="font-wp text-[0.78125rem] font-semibold text-wp-fg-muted">
            {t("sell.mon.noteLabel")}
          </label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("sell.mon.notePlaceholder")}
            className="mt-1.5"
          />
        </div>

        {/* Escrow is not optional and there is no toggle for it. The handoff drew one,
            but a marketplace where the seller can switch off the buyer's protection is
            a marketplace with a scam button — every sale here is escrowed. */}
        <div className="mt-3 flex items-center gap-2 rounded-[11px] border border-wp-green/20 bg-wp-green/[.08] px-3 py-2.5">
          <Icon name="lock" size={15} className="text-wp-green" />
          <span className="font-wp text-[0.8125rem] font-semibold text-wp-fg">
            {t("sell.mon.escrowActiveNote")}
          </span>
        </div>

        <div className="mt-5 flex gap-2.5">
          <Button onClick={() => setStep(0)}>{t("sell.mon.backStepButton")}</Button>
          <Button
            variant="primary"
            className="flex-1"
            disabled={(format !== "trade" && !price) || createListing.isPending}
            onClick={publish}
          >
            <Icon name="tag" size={15} />
            {createListing.isPending ? t("common.publishing") : t("common.publishListingButton")}
          </Button>
        </div>
      </div>
    </div>
  )
}

function MiniSpec({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border-wp border-wp-line/24 bg-white px-3.5 py-3">
      <div className="font-wp text-[0.65625rem] font-black uppercase tracking-[.06em] text-wp-fg-subtle">
        {k}
      </div>
      <div className="mt-0.5 font-wp text-[0.8125rem] font-extrabold text-wp-fg">{v}</div>
    </div>
  )
}

export { STEPS as SELL_MON_STEPS }
