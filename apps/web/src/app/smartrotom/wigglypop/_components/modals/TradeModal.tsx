"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import type { WpListing } from "../../_types/market.types"
import { userMessageFrom } from "@/services/boffAPI"
import { WigglypopService } from "@/services/api/smartrotom/wigglypopService"
import { usePcMons } from "../../_hooks/usePcMons"
import { useWpUuid } from "../../_hooks/queries"
import { Button, DividerLabel, EmptyState, Icon, Modal, ModalHead, Skeleton, Slot, toast } from "../ui"
import { MonRow, listingHero } from "./parts"

/**
 * Propose a swap. No money changes hands, which is why this is the only transaction
 * modal with no wallet row and no fee — a trade is settled entirely in Pokémon.
 *
 * You offer one of YOUR real box Pokémon. The snapshot travels with the proposal, so
 * the seller sees exactly what they are being offered (IVs, nature, shininess) rather
 * than just a species name.
 */
export function TradeModal({ listing: L, onClose }: { listing: WpListing; onClose: () => void }) {
  const t = useTranslations("wigglypop")
  const uuid = useWpUuid()
  const { mons, isLoading, error } = usePcMons()
  const [picked, setPicked] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const mon = listingHero(L)
  const chosen = mons.find((m) => m.pokemonKey === picked) ?? null

  async function send() {
    if (!uuid || !chosen) return
    setSending(true)
    const res = await WigglypopService.createTrade({
      listingId: L.id,
      proposerUuid: uuid,
      offeredPokemonKey: chosen.pokemonKey,
      offeredSnapshot: chosen,
    })
    setSending(false)
    if (!res.success) {
      toast(res.userMessage ?? t("toast.tradeSendError"), "error")
      return
    }
    toast(t("toast.tradeSent"), "success")
    onClose()
  }

  return (
    <Modal onClose={onClose} className="w-[min(37.5rem,94vw)]">
      <ModalHead
        title={t("common.proposeTrade")}
        sub={
          L.wants?.length
            ? t("modal.trade.sellerWants", { seller: L.seller.username, wants: L.wants.join(", ") })
            : t("modal.trade.sellerOpenToAny", { seller: L.seller.username })
        }
        onClose={onClose}
      />
      <div className="p-5">
        {mon && <MonRow mon={mon} />}

        <DividerLabel className="my-4">{t("modal.trade.yourOffer")}</DividerLabel>

        {error ? (
          <EmptyState icon="alert" title={t("common.pcReadErrorTitle")} body={userMessageFrom(error, t("common.retryFallback"))} />
        ) : isLoading ? (
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-wp-sm" />
            ))}
          </div>
        ) : mons.length === 0 ? (
          <EmptyState
            icon="package"
            title={t("common.emptyPcTitle")}
            body={t("modal.trade.emptyPcBody")}
          />
        ) : (
          <div className="wp-scroll grid max-h-[15rem] grid-cols-6 gap-2 overflow-y-auto pr-1">
            {mons.map((m) => (
              <Slot
                key={`${m.box}:${m.index}`}
                mon={m}
                selected={picked === m.pokemonKey}
                onClick={() => setPicked(m.pokemonKey)}
              />
            ))}
          </div>
        )}

        <Button
          variant="primary"
          className="mt-4 w-full py-[0.8125rem]"
          disabled={!chosen || sending}
          onClick={send}
        >
          <Icon name="swap" size={16} />
          {!chosen
            ? t("modal.trade.pickPokemon")
            : sending
              ? t("common.sending")
              : t("modal.trade.proposeButton", { chosen: chosen.name, mon: mon?.name ?? t("modal.trade.thisPokemonFallback") })}
        </Button>
      </div>
    </Modal>
  )
}
