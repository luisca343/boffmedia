import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Eyebrow, Icon } from "../ui"
import { countdown } from "../../_utils/format"
import { EVENT_META, type TaxiEvent } from "./types"

/**
 * [deferred] Eventos — the live in-world events board (raids, auctions, gym openings).
 *
 * There is no events API: no table, no endpoint, nothing that knows an event is
 * happening at a stop. The whole tab is gated out of the app rather than shown with
 * invented raids — a countdown to an event that isn't real is worse than no board.
 * Built here so it can ship the day the endpoint lands.
 */
export function EventCard({ event, onGo }: { event: TaxiEvent; onGo?: (stopId: string) => void }) {
  const t = useTranslations("taxi")
  const meta = EVENT_META[event.type]
  return (
    <div
      className={cn(
        "flex w-full items-start gap-3 rounded-tx-md border border-solid bg-tx-surface p-[0.8125rem] text-left",
        "transition-[border-color,background,transform] duration-150 ease-tx",
        "hover:-translate-y-px hover:border-tx-line-2 hover:bg-tx-surface-2",
        event.hot ? "border-tx-no/45" : "border-tx-line",
      )}
    >
      <span
        className="grid h-[2.625rem] w-[2.625rem] shrink-0 place-items-center rounded-xl text-white"
        style={{ background: `linear-gradient(140deg, ${meta.color}, ${meta.color}99)` }}
      >
        <Icon name={meta.icon} size={20} stroke={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-[3px] flex items-center gap-2">
          <span
            className="rounded-md px-[0.4375rem] py-0.5 text-[0.625rem] font-extrabold uppercase tracking-[0.5px]"
            style={{ background: `${meta.color}29`, color: meta.color }}
          >
            {t(`eventTypes.${meta.labelKey}`)}
          </span>
          {event.hot && (
            <span className="inline-flex items-center gap-1 text-[0.625rem] font-extrabold uppercase tracking-[0.5px] text-tx-no">
              <Icon name="flame" size={11} stroke={2.6} /> {t("eventsPanel.hot")}
            </span>
          )}
        </div>
        <div className="text-[0.90625rem] font-extrabold text-tx-txt">{event.title}</div>
        <div className="mt-[3px] text-[0.78125rem] leading-[1.45] text-tx-txt-2">{event.sub}</div>
        <div className="mt-[0.5625rem] flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-[0.3125rem] text-xs font-bold text-tx-txt-2">
            <Icon name="pin" size={13} stroke={2.4} className="text-tx-blue-400" />
            {event.stopId}
          </span>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1 font-tx-mono text-xs font-extrabold text-tx-money">
              <Icon name="clock" size={12} stroke={2.4} />
              {(() => {
                const c = countdown(event.endsInMin)
                return t(`countdown.${c.key}`, c.values)
              })()}
            </span>
            <button
              type="button"
              onClick={() => onGo?.(event.stopId)}
              className="inline-flex items-center gap-[0.3125rem] rounded-tx-pill border border-solid border-tx-line-2 bg-tx-surface-2 px-3 py-[0.4375rem] text-xs font-extrabold text-tx-txt transition-all duration-150 hover:border-tx-accent hover:bg-tx-accent hover:text-tx-on-accent"
            >
              <Icon name="nav" size={13} stroke={2.4} /> {t("eventsPanel.go")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** [deferred] The featured event — the board's hero. */
export function EventHero({ event, onGo }: { event: TaxiEvent; onGo?: (stopId: string) => void }) {
  const t = useTranslations("taxi")
  const meta = EVENT_META[event.type]
  return (
    <div className="relative overflow-hidden rounded-tx-lg bg-[linear-gradient(135deg,#08163a,rgb(var(--tx-blue-600)))] p-4 text-white after:pointer-events-none after:absolute after:inset-0 after:bg-[radial-gradient(120%_100%_at_110%_-20%,rgb(255_255_255/0.18),transparent_55%)]">
      <div className="relative mb-2.5 flex items-center gap-2">
        <span className="rounded-md bg-white/[0.16] px-[0.4375rem] py-0.5 text-[0.625rem] font-extrabold uppercase tracking-[0.5px] text-white">
          {t(`eventTypes.${meta.labelKey}`)}
        </span>
        <span className="inline-flex items-center gap-1 text-[0.6875rem] font-extrabold uppercase tracking-[0.5px] text-white/85">
          <Icon name="flame" size={12} stroke={2.6} /> {t("eventsPanel.featuredNow")}
        </span>
      </div>
      <div className="relative flex gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/[0.16] text-white">
          <Icon name={meta.icon} size={24} stroke={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[1.0625rem] font-extrabold">{event.title}</div>
          <div className="mt-[3px] text-[0.78125rem] leading-[1.45] opacity-80">{event.sub}</div>
        </div>
      </div>
      <div className="relative mt-3.5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-bold">
          <Icon name="clock" size={14} stroke={2.4} />{" "}
          {t("eventsPanel.endsIn", {
            time: (() => {
              const c = countdown(event.endsInMin)
              return t(`countdown.${c.key}`, c.values)
            })(),
          })}
        </span>
        <button
          type="button"
          onClick={() => onGo?.(event.stopId)}
          className="inline-flex items-center gap-[0.3125rem] rounded-tx-pill bg-tx-accent px-4 py-[0.5625rem] text-[0.8125rem] font-extrabold text-tx-on-accent"
        >
          <Icon name="nav" size={14} stroke={2.4} /> {t("eventsPanel.travelTo", { name: event.stopId })}
        </button>
      </div>
    </div>
  )
}

/** [deferred] The whole board — hero + the rest, soonest to end first. */
export function EventsPanel({ events, onGo }: { events: TaxiEvent[]; onGo?: (stopId: string) => void }) {
  const t = useTranslations("taxi.eventsPanel")
  const sorted = [...events].sort((a, b) => a.endsInMin - b.endsInMin)
  const featured = sorted.find((e) => e.hot) ?? sorted[0]
  const rest = sorted.filter((e) => e.id !== featured?.id)

  return (
    <div className="tx-scroll flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto p-3.5">
      <Eyebrow icon="bell" count={t("activeCount", { count: events.length })}>
        {t("liveEvents")}
      </Eyebrow>
      {featured && <EventHero event={featured} onGo={onGo} />}
      <Eyebrow icon="calendar">{t("endingSoon")}</Eyebrow>
      <div className="flex flex-col gap-[0.5625rem]">
        {rest.map((event) => (
          <EventCard key={event.id} event={event} onGo={onGo} />
        ))}
      </div>
    </div>
  )
}
