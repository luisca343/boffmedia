"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { Icon } from "@boffmedia/ui"
import { DkSearch, DkSeg, DkEmpty, DkSkelList } from "@/components/boffmedia/ui/tools/datakit"
import { LigaService, type LeagueReplay } from "@/services/api/smartrotom/ligaService"
import { cn } from "@/lib/utils"

type Scope = "recent" | "mine"

function mcUuidOf(session: unknown): string | null {
  const user = (session as { user?: { mcUuid?: string; smartRotomUser?: { uuid?: string } } } | null)?.user
  return user?.mcUuid ?? user?.smartRotomUser?.uuid ?? null
}

export function ReplaysView() {
  const t = useTranslations("battlesim")
  const { data: session } = useSession()
  const uuid = mcUuidOf(session)

  const [scope, setScope] = useState<Scope>("recent")
  const [rows, setRows] = useState<LeagueReplay[] | null>(null)
  const [error, setError] = useState(false)
  const [q, setQ] = useState("")

  useEffect(() => {
    let alive = true
    setRows(null)
    setError(false)
    const req = scope === "mine" && uuid ? LigaService.getPlayerReplays(uuid) : LigaService.getRecentReplays(40)
    req
      .then((res) => {
        if (!alive) return
        if (res.error || !res.data) setError(true)
        else setRows(Array.isArray(res.data) ? res.data : [])
      })
      .catch(() => { if (alive) setError(true) })
    return () => { alive = false }
  }, [scope, uuid])

  const filtered = useMemo(() => {
    if (!rows) return []
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((r) => `${r.side1} ${r.side2} ${r.winner}`.toLowerCase().includes(needle))
  }, [rows, q])

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <DkSearch value={q} onChange={setQ} placeholder={t("replays.search")} ariaLabel={t("replays.search")} className="min-w-[180px] flex-1" />
        {uuid && (
          <DkSeg
            value={scope}
            onChange={(v) => setScope(v as Scope)}
            ariaLabel={t("replays.scope")}
            options={[
              { value: "recent", label: t("replays.recent") },
              { value: "mine", label: t("replays.mine") },
            ]}
          />
        )}
      </div>

      {rows === null && <DkSkelList rows={6} h={64} />}

      {error && (
        <DkEmpty icon="alert" title={t("replays.errorTitle")} lead={t("replays.errorLead")} className="mx-auto max-w-[520px]" />
      )}

      {rows !== null && !error && filtered.length === 0 && (
        <DkEmpty icon="play" title={t("replays.emptyTitle")} lead={q ? t("replays.emptySearch") : t("replays.emptyLead")} className="mx-auto max-w-[520px]" />
      )}

      {rows !== null && !error && filtered.length > 0 && (
        <ul className="grid gap-[7px]">
          {filtered.map((r) => <ReplayRow key={r.id} r={r} winnerLabel={t("replays.winner")} />)}
        </ul>
      )}
    </div>
  )
}

function ReplayRow({ r, winnerLabel }: { r: LeagueReplay; winnerLabel: string }) {
  const p1Won = r.winner && r.winner === r.side1
  const p2Won = r.winner && r.winner === r.side2
  const date = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""
  return (
    <li>
      <a
        href={`/pokemon/battlesim/replay/${r.id}`}
        className="cut-tag cut-tag-edge hover:[--cut-line:var(--accent-line)] [--cut-tag:10px] group flex items-center gap-3 border border-solid border-line bg-panel px-4 py-3 transition-[border-color,background,transform] hover:-translate-y-px hover:border-accent-line hover:bg-panel-2"
      >
        <span className="grid min-w-0 flex-1 gap-[3px]">
          <span className="flex min-w-0 items-center gap-2 font-display text-[14px] font-bold uppercase leading-none tracking-[0.03em]">
            <b className={cn("min-w-0 truncate", p1Won ? "text-accent-bright" : "text-txt")}>{r.side1}</b>
            <span className="flex-none font-mono text-[10px] font-semibold text-txt-dim">VS</span>
            <b className={cn("min-w-0 truncate", p2Won ? "text-accent-bright" : "text-txt")}>{r.side2}</b>
          </span>
          <span className="flex items-center gap-2 font-mono text-[10.5px] leading-none text-txt-dim">
            {r.winner && (
              <span className="inline-flex items-center gap-1 text-ok">
                <Icon name="trophy" size={11} />{winnerLabel}: {r.winner}
              </span>
            )}
            {date && <span>· {date}</span>}
          </span>
        </span>
        <span className="flex flex-none items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-txt-dim transition-colors group-hover:text-accent-bright">
          <Icon name="play" size={13} />#{r.id}
        </span>
      </a>
    </li>
  )
}
