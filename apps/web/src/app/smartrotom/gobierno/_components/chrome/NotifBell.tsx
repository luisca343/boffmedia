"use client"

import { useEffect, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useTranslations } from "next-intl"
import type { NotificationsInboxDto } from "@boffmedia/shared"
import { rotomGETOrThrow, rotomPATCHOrThrow, userMessageFrom } from "@/services/boffAPI"
import { useGuardedSubmit } from "@/components/smartrotom/behavior/useGuardedSubmit"
import { Icon, Empty, toast } from "../ui"
import { useOfficer } from "../../_hooks/useOfficer"
import { useFormat } from "@/lib/useFormat"
import { TONES, type Tone } from "../../_utils/tones"

// The officer's real SmartRotom inbox — the platform's notifications table, not a
// government-only feed. Type maps to the tone of the dot beside it.
const TYPE_TONE: Record<string, Tone> = {
  system: "poblacion",
  chatapp: "seguridad",
  starbank: "hacienda",
  arcade: "justicia",
  misiones: "gold",
  bidkea: "urbanismo",
  admin: "default",
  gobierno: "civic",
}

export function NotifBell() {
  const t = useTranslations("gobierno")
  const { timeAgo } = useFormat()
  const { uuid } = useOfficer()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data } = useQuery({
    queryKey: ["gob", "notifs", uuid],
    queryFn: () =>
      rotomGETOrThrow<NotificationsInboxDto>(`/notifications?uuid=${encodeURIComponent(uuid)}&limit=12&offset=0`),
    enabled: !!uuid,
    staleTime: 30_000,
  })

  // `isRead` arrives as 0 | 1, not a boolean — it is a tinyint column.
  const items = data?.items ?? []
  const unread = items.filter((n) => !n.isRead).length

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  const { submit: markAllRead, isPending: marking } = useGuardedSubmit(async () => {
    if (!unread) return
    try {
      // Invalidating unconditionally would clear the badge on a write the server rejected,
      // so the refetch only follows a confirmed success.
      await rotomPATCHOrThrow("/notifications/read-all", { uuid })
      qc.invalidateQueries({ queryKey: ["gob", "notifs", uuid] })
    } catch (e) {
      toast.error(userMessageFrom(e, t("campana.markError")))
    }
  })

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? t("campana.unread", { count: unread }) : t("campana.titulo")}
        className="relative rounded-gt-sm border border-gt-line-strong bg-gt-paper-0 p-2 text-gt-ink-600 shadow-gt-sm transition-colors hover:bg-gt-paper-1 hover:text-gt-ink-900"
      >
        <Icon name="bell" size={17} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gt-danger px-1 font-gt-mono text-[9px] font-bold tabular-nums text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%_+_8px)] z-50 w-[340px] animate-gt-pop overflow-hidden rounded-gt border border-gt-line-strong bg-gt-paper-0 shadow-gt-lg motion-reduce:animate-none">
          <div className="flex items-center justify-between border-b border-gt-line px-4 py-2.5">
            <span className="font-gt-display text-sm font-bold text-gt-ink-900">{t("campana.titulo")}</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                disabled={marking}
                className="disabled:opacity-50 font-gt-mono text-[9.5px] font-bold uppercase tracking-[.12em] text-gt-accent hover:underline"
              >
                {t("campana.marcarLeidas")}
              </button>
            )}
          </div>

          <div className="gt-scroll max-h-[340px] overflow-y-auto">
            {items.length === 0 ? (
              <Empty icon="bell" title={t("campana.sinAvisos")} sub={t("campana.sinAvisosSub")} />
            ) : (
              items.map((n) => {
                const tone = TONES[TYPE_TONE[n.type ?? ""] ?? "default"]
                const row = (
                  <div
                    className={`gt-spine flex gap-2.5 border-b border-gt-line-soft px-4 py-3 last:border-b-0 ${n.isRead ? "" : "bg-gt-paper-1"}`}
                    style={{ ["--gt-dep" as string]: tone.css }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-gt-ink-900">{n.title}</div>
                      {n.body && <div className="mt-0.5 line-clamp-2 text-[12px] text-gt-ink-500">{n.body}</div>}
                      <div className="mt-1 font-gt-mono text-[9.5px] uppercase tracking-[.1em] text-gt-ink-400">
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>
                    {!n.isRead && <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${tone.dot}`} />}
                  </div>
                )
                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={() => setOpen(false)} className="block hover:bg-gt-paper-2">
                    {row}
                  </Link>
                ) : (
                  <div key={n.id}>{row}</div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
