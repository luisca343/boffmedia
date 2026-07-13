"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Icon, ProgressBar, Switch } from "../ui"
import { formatMoney, formatNum } from "../../_utils/format"
import type { Achievement, CoinPackage, PartyMember, RiderTier } from "./types"

/**
 * [deferred] Group teleport — bring your party along, each extra rider costing a share of
 * the fare.
 *
 * Needs two things we don't have: a party/roster endpoint (who is grouped with whom) and
 * a server-side multi-passenger teleport. Teleporting other players by charging the
 * payer client-side is not something the client may decide.
 */
export function GroupTeleport({
  party,
  fare,
  rate = 0.6,
}: {
  party: PartyMember[]
  fare: number
  /** Each extra rider costs this share of the base fare. */
  rate?: number
}) {
  const [open, setOpen] = useState(false)
  const [members, setMembers] = useState<string[]>([])
  const groupAdd = Math.round(fare * rate * members.length)
  const online = party.filter((p) => p.online).length

  const toggle = (id: string) =>
    setMembers((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]))

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setOpen((o) => !o)
          }
        }}
        className={cn(
          "mt-3 flex cursor-pointer items-center gap-2.5 rounded-tx-md border border-solid bg-tx-surface px-3 py-[11px]",
          "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tx-accent",
          open ? "border-tx-blue-500" : "border-tx-line",
        )}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-tx-surface-2 text-tx-blue-400">
          <Icon name="users" size={17} stroke={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <b className="text-[13px] font-extrabold text-tx-txt">
            Viaje en grupo {members.length > 0 && `· ${members.length + 1} pasajeros`}
          </b>
          <span className="block text-[11.5px] text-tx-txt-2">
            {members.length > 0
              ? `+${formatMoney(groupAdd)} por tu party`
              : `Lleva a tu party (${online} en línea)`}
          </span>
        </div>
        <Switch on={open} />
      </div>

      {open && (
        <div className="mt-[9px] flex flex-col gap-[7px] animate-tx-card-in motion-reduce:animate-none">
          {party.map((member) => {
            const on = members.includes(member.id)
            return (
              <div
                key={member.id}
                role="button"
                tabIndex={member.online ? 0 : -1}
                aria-pressed={on}
                onClick={() => member.online && toggle(member.id)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && member.online) {
                    e.preventDefault()
                    toggle(member.id)
                  }
                }}
                className={cn(
                  "flex items-center gap-2.5 rounded-tx-sm border border-solid px-2.5 py-2 transition-all duration-150",
                  on ? "border-tx-blue-500 bg-tx-blue-600/[0.12]" : "border-tx-line bg-tx-surface",
                  !member.online && "opacity-45",
                )}
              >
                <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-[linear-gradient(140deg,rgb(var(--tx-blue-400)),rgb(var(--tx-blue-700)))] text-[11px] font-extrabold text-white">
                  {member.initials}
                </span>
                <span className="flex-1 text-[13px] font-bold text-tx-txt">{member.name}</span>
                <span className={cn("text-[11px]", member.online ? "text-tx-ok" : "text-tx-txt-3")}>
                  {member.online ? "en línea" : "desconectado"}
                </span>
                <span
                  className={cn(
                    "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px] border-[1.5px] border-solid",
                    on ? "border-tx-blue-500 bg-tx-blue-600 text-white" : "border-tx-line-2 text-transparent",
                  )}
                >
                  <Icon name="check" size={13} stroke={3} />
                </span>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

/**
 * [deferred] The frequent-rider pass — tier, per-trip discount, streak, free-ride
 * progress.
 *
 * Trip counts are real (they come out of the ledger), but a tier that grants a real
 * discount is a pricing rule, and pricing lives on the server. There is no tier table, no
 * discount field, no streak. Showing a "−10% en cada viaje" the checkout would not honour
 * is a lie the player pays for.
 */
export function RiderCard({
  tier,
  next,
  trips,
  streakDays,
  freeRideEvery,
}: {
  tier: RiderTier
  next?: RiderTier
  trips: number
  streakDays: number
  freeRideEvery: number
}) {
  const pct = next ? Math.min(100, Math.round(((trips - tier.min) / (next.min - tier.min)) * 100)) : 100

  return (
    <div className="relative overflow-hidden rounded-tx-lg border border-solid border-tx-line-2 bg-[linear-gradient(135deg,#0b1c45,#15306e)] p-4 text-white shadow-tx-1">
      <span className="pointer-events-none absolute -right-[10%] -top-[40%] h-[200px] w-[200px] rounded-full bg-[radial-gradient(circle,var(--tx-accent-glow),transparent_65%)]" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-[38px] w-[38px] place-items-center rounded-[11px]"
            style={{
              background: `${tier.color}3d`,
              color: tier.color,
              boxShadow: `0 0 18px ${tier.color}66`,
            }}
          >
            <Icon name="trophy" size={20} stroke={2.2} />
          </span>
          <div>
            <div className="font-tx-display text-[15px] font-bold tracking-[0.4px]" style={{ color: tier.color }}>
              Socio {tier.name}
            </div>
            <div className="text-[11.5px] text-white/60">Programa Pasajero Frecuente</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-tx-mono text-[26px] font-extrabold leading-none text-tx-accent">
            {tier.discount > 0 ? `−${Math.round(tier.discount * 100)}%` : "—"}
          </div>
          <div className="mt-[3px] text-[10.5px] uppercase tracking-[0.5px] text-white/60">en cada viaje</div>
        </div>
      </div>

      <div className="relative mt-4">
        <div className="mb-1.5 flex justify-between text-[11.5px] font-bold text-white/70">
          <span>{next ? `${next.min - trips} viajes para ${next.name}` : "Nivel máximo alcanzado"}</span>
          <span className="font-tx-mono">
            {trips}
            {next && ` / ${next.min}`}
          </span>
        </div>
        <div className="h-[7px] overflow-hidden rounded-[4px] bg-white/15">
          <span
            className="block h-full rounded-[4px] bg-gradient-to-r from-tx-blue-400 to-tx-accent"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="relative mt-3.5 flex gap-4">
        <div className="flex items-center gap-[7px]">
          <span className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-white/10 text-tx-accent">
            <Icon name="flame" size={15} stroke={2.2} />
          </span>
          <div>
            <div className="text-[15px] font-extrabold">{streakDays} días</div>
            <div className="text-[10.5px] text-white/60">Racha activa</div>
          </div>
        </div>
        <div className="flex items-center gap-[7px]">
          <span className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-white/10 text-tx-accent">
            <Icon name="gift" size={15} stroke={2.2} />
          </span>
          <div>
            <div className="text-[15px] font-extrabold">
              {trips % freeRideEvery}/{freeRideEvery}
            </div>
            <div className="text-[10.5px] text-white/60">Viaje gratis</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * [deferred] An achievement row. Some of these could be computed from the ledger, but an
 * achievement that grants nothing is just a statistic wearing a medal — the rewards
 * backend has to exist first.
 */
export function AchievementRow({ achievement }: { achievement: Achievement }) {
  const { done, progress = 0, goal = 1 } = achievement
  const pct = done ? 100 : Math.min(100, Math.round((progress / goal) * 100))
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-tx-md border border-solid bg-tx-surface p-3",
        done ? "border-tx-accent-soft" : "border-tx-line",
      )}
    >
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
          done ? "bg-tx-accent text-tx-on-accent" : "bg-tx-surface-2 text-tx-txt-3",
        )}
      >
        <Icon name={achievement.icon} size={19} stroke={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-[7px] text-[13.5px] font-extrabold text-tx-txt">
          {achievement.name}
          {done && (
            <span className="rounded-[5px] bg-tx-ok-soft px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.4px] text-tx-ok">
              Logrado
            </span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-tx-txt-2">{achievement.desc}</div>
        {!done && (
          <div className="mt-2 flex items-center gap-2">
            <ProgressBar pct={pct} className="flex-1" />
            <span className="shrink-0 font-tx-mono text-[11px] font-bold text-tx-txt-3">
              {formatNum(progress)}/{formatNum(goal)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * [deferred] Coin packs — the handoff's real-money storefront.
 *
 * There is no packages endpoint, no payment provider and no prices; the euro figures in
 * the handoff are placeholders. Shipping a checkout that takes money for coins that
 * cannot be credited is the one fabrication with a real-world cost, so the wallet ships
 * without it.
 */
export function TopUpGrid({ packages }: { packages: CoinPackage[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {packages.map((pkg) => (
        <button
          key={pkg.id}
          type="button"
          className="group relative rounded-tx-md border border-solid border-tx-line bg-tx-surface p-3.5 text-left transition-all duration-150 ease-tx hover:-translate-y-0.5 hover:border-tx-accent hover:bg-tx-surface-2"
        >
          {pkg.tag && (
            <span className="absolute -top-2 right-2.5 whitespace-nowrap rounded-md bg-tx-accent px-2 py-[3px] text-[9.5px] font-extrabold uppercase tracking-[0.4px] text-tx-on-accent">
              {pkg.tag}
            </span>
          )}
          <div className="flex items-center gap-1.5 font-tx-mono text-[19px] font-extrabold text-tx-txt">
            <Icon name="coins" size={17} stroke={2.2} className="text-tx-accent" />
            {formatNum(pkg.coins)}
          </div>
          <div
            className={cn(
              "mt-1 text-[11.5px] font-extrabold",
              pkg.bonus ? "text-tx-ok" : "font-bold text-tx-txt-3",
            )}
          >
            {pkg.bonus ? `+${formatNum(pkg.bonus)} bonus` : "sin bonus"}
          </div>
          <div className="mt-[11px] rounded-tx-sm bg-tx-blue-600 py-[9px] text-center text-[13.5px] font-extrabold text-white transition-colors group-hover:bg-tx-blue-500">
            {pkg.price}
          </div>
        </button>
      ))}
    </div>
  )
}
