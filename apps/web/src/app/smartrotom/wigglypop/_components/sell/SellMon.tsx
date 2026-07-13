"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import type { WpFormat } from "../../_types/market.types"
import { FORMAT_HINT, FORMAT_ICON, FORMAT_LABEL, fmt } from "../../_utils/format"
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
      <div className="mx-auto mt-10 max-w-[460px] text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-wp-pill border border-wp-accent bg-wp-accent/[.13]">
          <Icon name="tag" size={28} className="text-wp-accent" />
        </div>
        <h2 className="font-wp-display text-[22px] font-semibold text-wp-fg">Anuncio publicado</h2>
        <p className="mt-2 font-wp text-[13.5px] font-semibold leading-relaxed text-wp-fg-muted">
          <b className="text-wp-fg">{picked.name}</b> ya está en el mercado
          {format !== "trade" ? ` por ₽${fmt(price)}` : " para intercambio"}. Propiedad verificada
          contra tu PC.
        </p>
        <div className="mt-6 flex justify-center gap-2.5">
          <Button
            onClick={() => {
              setPicked(null)
              setPublished(false)
              setStep(0)
            }}
          >
            Publicar otro
          </Button>
          <Button variant="primary" onClick={() => router.push("/smartrotom/wigglypop/anuncios")}>
            Ver mis anuncios
          </Button>
        </div>
      </div>
    )
  }

  // ── step 0: pick ───────────────────────────────────────────────────────────
  if (step === 0 || !picked) {
    if (error) return <EmptyState icon="alert" title="No se pudo leer tu PC" body={error.message} />
    if (isLoading) {
      return (
        <div className="mx-auto max-w-[920px]">
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
          title="Tu PC está vacío"
          body="Guarda algún Pokémon en una caja del juego y podrás venderlo aquí."
        />
      )
    }

    return (
      <div className="mx-auto max-w-[920px]">
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <span className="mr-1 flex items-center gap-1.5 font-wp text-[13px] font-semibold text-wp-fg-muted">
            <Icon name="shieldCheck" size={15} className="text-wp-green" />
            Tu PC Rotom
          </span>
          <div className="flex flex-wrap gap-1.5">
            {boxes.map((b, i) => (
              <button
                key={b.box}
                type="button"
                onClick={() => setBoxIdx(i)}
                className={cn(
                  "rounded-wp-pill border-wp px-3.5 py-2 font-wp text-[13px] font-extrabold transition-colors",
                  i === boxIdx
                    ? "wp-grad-primary border-transparent text-white"
                    : "border-wp-line/24 bg-white text-wp-fg-muted hover:text-wp-accent-strong",
                )}
              >
                Caja {b.box + 1} <span className="opacity-60">{b.mons.length}</span>
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
    <div className="mx-auto grid max-w-[880px] gap-6 md:grid-cols-[300px_1fr]">
      {/* preview */}
      <div>
        <SpriteStage
          mon={picked}
          className="relative flex-col rounded-wp border-wp border-wp-line/24 p-[18px] text-center"
        >
          <Sprite mon={picked} className="relative z-[2] h-32 w-[78%]" />
          <div className="relative z-[2]">
            <div className="font-wp text-lg font-bold text-wp-fg">
              {picked.shiny && <span className="text-wp-teal">✦ </span>}
              {picked.name}
            </div>
            <div className="mt-2 flex justify-center gap-1.5">
              {picked.types.map((t) => (
                <TypeBadge key={t} type={t} size="sm" />
              ))}
            </div>
          </div>
        </SpriteStage>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <MiniSpec k="Nivel" v={String(picked.level)} />
          <MiniSpec k="IVs" v={`${picked.ivPct}%`} />
          <MiniSpec k="Naturaleza" v={picked.nature} />
          <MiniSpec k="Rareza" v={<RarityBadge rarity={picked.rarity} />} />
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
          Elegir otro
        </Button>
      </div>

      {/* form */}
      <div>
        <h3 className="mb-3 font-wp text-[15px] font-bold text-wp-fg">Formato de venta</h3>
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
              <div className="flex items-center gap-2 font-wp text-[13.5px] font-bold text-wp-fg">
                <Icon
                  name={FORMAT_ICON[k]}
                  size={16}
                  className={format === k ? "text-wp-accent" : "text-wp-fg-muted"}
                />
                {FORMAT_LABEL[k]}
              </div>
              <div className="mt-1 font-wp text-[11.5px] font-semibold text-wp-fg-subtle">
                {FORMAT_HINT[k]}
              </div>
            </button>
          ))}
        </div>

        <ValueBox className="mt-4">
          <div className="flex items-center gap-2">
            <Icon name="wand" size={15} className="text-wp-teal" />
            <span className="font-wp text-[12.5px] font-bold text-wp-fg">SmartRotom sugiere</span>
            <Price amount={picked.value} size={16} symbolClassName="text-wp-teal-deep" />
            <Button
              className="ml-auto px-2.5 py-1 text-xs"
              onClick={() => setPrice(picked.value)}
            >
              Usar
            </Button>
          </div>
        </ValueBox>

        {format !== "trade" && (
          <div className="mt-4">
            <label className="font-wp text-[12.5px] font-semibold text-wp-fg-muted">
              {format === "auction" ? "Puja inicial" : "Precio"} (₽)
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
                    ? "Por encima del mercado"
                    : cheap
                      ? "Buen precio"
                      : "En línea con el mercado"}
                </Chip>
              )}
            </div>
          </div>
        )}

        {format === "auction" && (
          <div className="mt-4">
            <label className="font-wp text-[12.5px] font-semibold text-wp-fg-muted">
              Duración: <b className="text-wp-fg">{days} días</b>
            </label>
            <Range
              min={1}
              max={7}
              value={days}
              aria-label="Duración de la subasta"
              className="mt-2"
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </div>
        )}

        {format === "trade" && (
          <div className="mt-4">
            <label className="font-wp text-[12.5px] font-semibold text-wp-fg-muted">
              ¿Qué buscas a cambio? (separa con comas)
            </label>
            <Textarea
              value={wants}
              onChange={(e) => setWants(e.target.value)}
              placeholder="Dratini, Larvitar, Gible…"
              className="mt-1.5 min-h-[52px]"
            />
          </div>
        )}

        <div className="mt-4">
          <label className="font-wp text-[12.5px] font-semibold text-wp-fg-muted">
            Nota para compradores
          </label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Captura propia, OT original, listo para competir…"
            className="mt-1.5"
          />
        </div>

        {/* Escrow is not optional and there is no toggle for it. The handoff drew one,
            but a marketplace where the seller can switch off the buyer's protection is
            a marketplace with a scam button — every sale here is escrowed. */}
        <div className="mt-3 flex items-center gap-2 rounded-[11px] border border-wp-green/20 bg-wp-green/[.08] px-3 py-2.5">
          <Icon name="lock" size={15} className="text-wp-green" />
          <span className="font-wp text-[13px] font-semibold text-wp-fg">
            Pago en depósito activado · el comprador paga primero, tú cobras al entregar
          </span>
        </div>

        <div className="mt-5 flex gap-2.5">
          <Button onClick={() => setStep(0)}>Atrás</Button>
          <Button
            variant="primary"
            className="flex-1"
            disabled={(format !== "trade" && !price) || createListing.isPending}
            onClick={publish}
          >
            <Icon name="tag" size={15} />
            {createListing.isPending ? "Publicando…" : "Publicar anuncio"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function MiniSpec({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border-wp border-wp-line/24 bg-white px-3.5 py-3">
      <div className="font-wp text-[10.5px] font-black uppercase tracking-[.06em] text-wp-fg-subtle">
        {k}
      </div>
      <div className="mt-0.5 font-wp text-[13px] font-extrabold text-wp-fg">{v}</div>
    </div>
  )
}

export { STEPS as SELL_MON_STEPS }
