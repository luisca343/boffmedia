"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import type { ArcadeInventoryItem } from "@boffmedia/shared"
import { getItemName } from "@/lib/intlUtils"
import { ItemImage } from "@/lib/ItemImage"
import { isMinecraft } from "@/services/mcef/mcefHelper"
import { userMessageFrom } from "@/services/boffAPI"
import { cn } from "@/lib/utils"
import { useClaimItems } from "../../_hooks/queries"
import { remaining } from "../../_utils/inventory"
import { raritySkin } from "../../_utils/rarity"
import { Button, Icon, Modal, Tag } from "../../_components/ui"

export interface ClaimModalProps {
  open: boolean
  onClose: () => void
  /** The collection, already free of unopened boxes. */
  items: ArcadeInventoryItem[]
}

/** A Minecraft chest is 27 slots; a stack is 64 of one item. */
const STACK = 64
const CHEST_SLOTS = 27

/** Chests are physical containers — they cannot be posted back into the game. */
const isChest = (item: ArcadeInventoryItem) => item.itemId.toLowerCase().includes("chest")

function ClaimRow({
  item,
  name,
  selected,
  onToggle,
}: {
  item: ArcadeInventoryItem
  name: string
  selected: boolean
  onToggle: () => void
}) {
  const t = useTranslations("arcade")
  const skin = raritySkin(item.rarity)
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className="ar-lift flex w-full items-center gap-3 rounded-[10px] border p-2.5 text-left"
      style={{
        background: selected ? `linear-gradient(90deg, ${skin.bg}, rgba(0,0,0,0.4))` : "rgba(0,0,0,0.3)",
        borderColor: selected ? skin.fg : "rgba(255,255,255,0.06)",
      }}
    >
      <span
        aria-hidden
        className="grid h-[1.125rem] w-[1.125rem] shrink-0 place-items-center rounded border-[1.5px] text-[0.6875rem] font-black text-[#06031a]"
        style={{
          borderColor: selected ? skin.fg : "rgba(255,255,255,0.2)",
          background: selected ? skin.fg : "transparent",
        }}
      >
        {selected ? "✓" : ""}
      </span>

      <span
        className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md border"
        style={{
          background: `radial-gradient(60% 60% at 50% 40%, ${skin.fg}33, transparent 70%)`,
          borderColor: skin.bd,
        }}
      >
        <ItemImage type={item.itemType} itemId={item.itemData || item.itemId} size={28} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-ar text-[0.8125rem] font-semibold text-ar-ink">{name}</span>
        <span
          className="mt-1 block font-ar-display text-[0.5rem] uppercase tracking-[0.12em]"
          style={{ color: skin.fg }}
        >
          {t(skin.nameKey)}
        </span>
      </span>

      <span className="shrink-0 font-ar-mono text-xs font-bold tabular-nums text-ar-amber">
        ×{remaining(item)}
      </span>
    </button>
  )
}

export function ClaimModal({ open, onClose, items }: ClaimModalProps) {
  const t = useTranslations("arcade")
  const claim = useClaimItems()
  const [selected, setSelected] = useState<number[]>([])
  const [inGame, setInGame] = useState(true)

  // `window.mcefQuery` only exists inside the Minecraft browser, so it can only be
  // probed after mount — reading it during render would desync hydration.
  useEffect(() => {
    if (open) setInGame(isMinecraft())
  }, [open])

  const claimable = useMemo(() => items.filter((i) => !isChest(i)), [items])
  const pokemon = claimable.filter((i) => i.itemType === "pokemon")
  const regular = claimable.filter((i) => i.itemType !== "pokemon")

  const picked = claimable.filter((i) => selected.includes(i.id))
  const pickedRegular = picked.filter((i) => i.itemType !== "pokemon")
  const pickedPokemon = picked.filter((i) => i.itemType === "pokemon")

  const chests = useMemo(() => {
    const slots = pickedRegular.reduce(
      (sum, item) => sum + Math.ceil(Math.max(1, remaining(item)) / STACK),
      0,
    )
    return { slots, chests: Math.ceil(slots / CHEST_SLOTS) }
  }, [pickedRegular])

  const close = () => {
    claim.reset()
    setSelected([])
    onClose()
  }

  const toggle = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const submit = async () => {
    if (picked.length === 0 || claim.isPending) return
    try {
      await claim.mutateAsync(picked)
      setSelected([])
    } catch {
      // Surfaced through `claim.isError` below.
    }
  }

  const result = claim.data

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      tone="magenta"
      kicker={t("coleccion.claim.kicker")}
      title={result ? t("coleccion.claim.claimedTitle") : t("coleccion.claim.moveToGame")}
      footer={
        result ? (
          <Button variant="amber" size="md" onClick={close}>
            {t("common.done")}
          </Button>
        ) : (
          <>
            <Button variant="ghost" size="md" onClick={close}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="amber"
              size="md"
              icon={<Icon.Sparkle s={14} />}
              onClick={() => void submit()}
              disabled={picked.length === 0 || claim.isPending}
            >
              {claim.isPending
                ? t("coleccion.claim.claiming")
                : t("coleccion.claim.claimItems", { count: picked.length })}
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="flex flex-col gap-3">
          <Tag tone="lime" size="lg">
            <Icon.Shield s={14} /> {t("coleccion.claim.deliveredInGame")}
          </Tag>
          <p className="rounded-[10px] border border-white/[.07] bg-black/40 p-3 font-ar-mono text-[0.6875rem] leading-relaxed text-ar-ink-dim">
            {t("coleccion.claim.deliveredDescription")}
          </p>
        </div>
      ) : claimable.length === 0 ? (
        <p className="py-8 text-center font-ar-mono text-[0.75rem] text-ar-ink-muted">
          {t("coleccion.claim.noItemsToClaim")}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-ar-ink-dim">
            {t("coleccion.claim.selectItemsDescription")}
          </p>

          {!inGame && (
            <p
              role="alert"
              className="rounded-[10px] border border-ar-amber/35 bg-ar-amber/[.08] p-3 font-ar-mono text-[0.6875rem] leading-relaxed text-ar-amber"
            >
              {t("coleccion.claim.outsideMinecraft")}
            </p>
          )}

          {claim.isError && (
            <p
              role="alert"
              className="rounded-[10px] border border-ar-danger/40 bg-ar-danger/[.08] p-3 font-ar-mono text-[0.6875rem] text-ar-danger"
            >
              {userMessageFrom(claim.error, t("coleccion.claim.claimError"))}
            </p>
          )}

          {pokemon.length > 0 && (
            <section>
              <h3 className="mb-2 border-b border-white/[.07] pb-1.5 font-ar-display text-[0.5625rem] uppercase tracking-[0.18em] text-ar-violet-2">
                {t("coleccion.claim.pokemonSection")}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {pokemon.map((item) => (
                  <ClaimRow
                    key={item.id}
                    item={item}
                    name={getItemName(t, item.itemId, item.itemType)}
                    selected={selected.includes(item.id)}
                    onToggle={() => toggle(item.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {regular.length > 0 && (
            <section>
              <h3 className="mb-2 border-b border-white/[.07] pb-1.5 font-ar-display text-[0.5625rem] uppercase tracking-[0.18em] text-ar-amber">
                {t("coleccion.claim.minecraftSection")}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {regular.map((item) => (
                  <ClaimRow
                    key={item.id}
                    item={item}
                    name={getItemName(t, item.itemId, item.itemType)}
                    selected={selected.includes(item.id)}
                    onToggle={() => toggle(item.id)}
                  />
                ))}
              </div>
            </section>
          )}

          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-ar-amber/25 bg-ar-amber/[.06] px-3.5 py-3",
              picked.length === 0 && "opacity-60",
            )}
          >
            <span className="font-ar-mono text-xs text-ar-ink-dim">
              {t.rich("coleccion.claim.selected", {
                count: picked.length,
                b: (chunks) => <b className="text-ar-amber">{chunks}</b>,
              })}
              {pickedPokemon.length > 0 && (
                <>
                  {" · "}
                  {t.rich("coleccion.claim.selectedPokemon", {
                    count: pickedPokemon.length,
                    b: (chunks) => <b className="text-ar-violet-2">{chunks}</b>,
                  })}
                </>
              )}
            </span>
            {pickedRegular.length > 0 && (
              <span className="font-ar-mono text-xs text-ar-ink-dim">
                {t.rich("coleccion.claim.occupy", {
                  slots: chests.slots,
                  chests: chests.chests,
                  b: (chunks) => <b className="text-ar-ink">{chunks}</b>,
                  c: (chunks) => <b className="text-ar-amber">{chunks}</b>,
                })}
              </span>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
