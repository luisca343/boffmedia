"use client"

import { useState } from "react"
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
      toast(res.userMessage ?? "No se pudo enviar la propuesta", "error")
      return
    }
    toast("Propuesta de intercambio enviada", "success")
    onClose()
  }

  return (
    <Modal onClose={onClose} className="w-[min(600px,94vw)]">
      <ModalHead
        title="Proponer intercambio"
        sub={
          L.wants?.length
            ? `${L.seller.username} busca: ${L.wants.join(", ")}`
            : `${L.seller.username} acepta propuestas`
        }
        onClose={onClose}
      />
      <div className="p-5">
        {mon && <MonRow mon={mon} />}

        <DividerLabel className="my-4">Ofreces de tu PC</DividerLabel>

        {error ? (
          <EmptyState icon="alert" title="No se pudo leer tu PC" body={userMessageFrom(error, "Inténtalo de nuevo en unos segundos.")} />
        ) : isLoading ? (
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-wp-sm" />
            ))}
          </div>
        ) : mons.length === 0 ? (
          <EmptyState
            icon="package"
            title="Tu PC está vacío"
            body="Necesitas al menos un Pokémon guardado en una caja para poder intercambiar."
          />
        ) : (
          <div className="wp-scroll grid max-h-[240px] grid-cols-6 gap-2 overflow-y-auto pr-1">
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
          className="mt-4 w-full py-[13px]"
          disabled={!chosen || sending}
          onClick={send}
        >
          <Icon name="swap" size={16} />
          {!chosen
            ? "Elige un Pokémon"
            : sending
              ? "Enviando…"
              : `Proponer ${chosen.name} por ${mon?.name ?? "este Pokémon"}`}
        </Button>
      </div>
    </Modal>
  )
}
