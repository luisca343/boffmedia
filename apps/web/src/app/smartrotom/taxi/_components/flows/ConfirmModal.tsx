"use client"

import { cn } from "@/lib/utils"
import { Button, Icon, Modal } from "../ui"
import { fareBreakdown } from "../../_utils/fare"
import { formatMoney, formatNum } from "../../_utils/format"
import { PRICE_PER_BLOCK } from "../../_utils/constants"
import type { EnrichedStop, Position } from "../../_types"

/**
 * The last screen before money moves. It shows the route, itemises the fare (base +
 * distance — exactly the formula the server charges), and states the balance before and
 * after, so nothing about the charge is a surprise.
 */
export function ConfirmModal({
  stop,
  player,
  balance,
  pending,
  onConfirm,
  onCancel,
}: {
  stop: EnrichedStop
  player: Position
  balance: number
  pending: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const fare = fareBreakdown(stop.dist)
  const after = balance - fare.total

  return (
    <Modal onClose={onCancel} label="Confirmar viaje">
      <div className="rounded-tx-lg border border-solid border-tx-line bg-tx-surface px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span className="h-[26px] w-[26px] shrink-0 rounded-full bg-tx-blue-500 shadow-[0_0_0_4px_rgb(var(--tx-blue-500)/0.22)]" />
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.4px] text-tx-txt-3">Origen</div>
            <div className="mt-px text-sm font-bold text-tx-txt">
              Tu posición ·{" "}
              <span className="font-tx-mono">
                {player.x}, {player.z}
              </span>
            </div>
          </div>
        </div>
        <div className="pl-[13px]">
          <span className="block h-[22px] w-0.5 rounded-sm bg-gradient-to-b from-tx-blue-500 to-tx-accent" />
        </div>
        <div className="flex items-center gap-3">
          <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-tx-accent text-tx-on-accent shadow-[0_0_0_4px_var(--tx-accent-soft)]">
            <Icon name="pin" size={12} stroke={2.6} />
          </span>
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.4px] text-tx-txt-3">Destino</div>
            <div className="mt-px text-sm font-bold text-tx-txt">
              {stop.id} ·{" "}
              <span className="font-tx-mono">
                {stop.x}, {stop.z}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="my-4 flex flex-col gap-2.5">
        <FareRow label="Tarifa base" value={formatMoney(fare.base)} />
        <FareRow
          label={`Distancia · ${formatNum(fare.dist)} b × ${PRICE_PER_BLOCK} ¥`}
          value={formatMoney(fare.distanceFare)}
        />
        <div className="mt-0.5 flex justify-between border-t border-dashed border-tx-line-2 pt-3 text-base font-extrabold text-tx-txt">
          <span>Total</span>
          <span className="font-tx-mono text-tx-money">{formatMoney(fare.total)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-tx-md border border-solid border-tx-line bg-tx-surface px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.4px] text-tx-txt-3">Saldo actual</span>
          <strong className="font-tx-mono text-base text-tx-txt">{formatMoney(balance)}</strong>
        </div>
        <span className="shrink-0 text-tx-txt-3">
          <Icon name="arrowR" size={16} stroke={2.2} />
        </span>
        <div className="flex flex-col gap-0.5 text-right">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.4px] text-tx-txt-3">Tras el viaje</span>
          <strong className="font-tx-mono text-base text-tx-txt">{formatMoney(after)}</strong>
        </div>
      </div>

      <div className="mt-[18px] flex gap-2.5">
        <Button variant="quiet" onClick={onCancel} disabled={pending} className="flex-[0_0_38%]">
          Cancelar
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={pending}>
          <Icon name="nav" size={17} stroke={2.4} />
          {pending ? "Cobrando…" : "Confirmar viaje"}
        </Button>
      </div>
    </Modal>
  )
}

function FareRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between text-[13.5px] text-tx-txt-2", className)}>
      <span>{label}</span>
      <span className="font-tx-mono font-bold text-tx-txt">{value}</span>
    </div>
  )
}

/** The fare exceeds the balance. States the shortfall exactly, then offers the way out. */
export function InsufficientModal({
  stop,
  price,
  balance,
  onClose,
  onTopUp,
}: {
  stop: EnrichedStop
  price: number
  balance: number
  onClose: () => void
  onTopUp: () => void
}) {
  return (
    <Modal onClose={onClose} label="Saldo insuficiente">
      <div className="px-0 pb-1.5 pt-2 text-center">
        <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-[18px] bg-tx-no-soft text-tx-no">
          <Icon name="wallet" size={26} stroke={2} />
        </span>
        <h3 className="mb-1.5 text-[19px] font-extrabold text-tx-txt">Saldo insuficiente</h3>
        <p className="mb-4 text-sm text-tx-txt-2">
          Te faltan <strong className="text-tx-txt">{formatMoney(price - balance)}</strong> para viajar a {stop.id}.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-tx-md border border-solid border-tx-line bg-tx-surface px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.4px] text-tx-txt-3">Tu saldo</span>
          <strong className="font-tx-mono text-base text-tx-no">{formatMoney(balance)}</strong>
        </div>
        <span className="shrink-0 text-tx-txt-3">
          <Icon name="arrowR" size={16} stroke={2.2} />
        </span>
        <div className="flex flex-col gap-0.5 text-right">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.4px] text-tx-txt-3">Tarifa</span>
          <strong className="font-tx-mono text-base text-tx-money">{formatMoney(price)}</strong>
        </div>
      </div>

      <div className="mt-[18px] flex gap-2.5">
        <Button variant="quiet" onClick={onClose} className="flex-[0_0_38%]">
          Cerrar
        </Button>
        <Button variant="primary" onClick={onTopUp}>
          <Icon name="wallet" size={16} stroke={2.2} />
          Ver cartera
        </Button>
      </div>
    </Modal>
  )
}
