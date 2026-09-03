"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Banner, Button, ConfirmDialog, Icon, Menu, cn, toast, useFormat } from "@boffmedia/ui"
import { DkSearch, DkSeg, DkEmpty, DkSkelList } from "@boffmedia/ui/datakit"
import { toolApi, useToolOnline } from "@boffmedia/tool-kit"

import { useToolT, BATTLESIM_NS } from "../i18n"
import { useBsimNav } from "../nav"
import { listReplays, removeReplay } from "../storage"
import { fetchServerReplays } from "../sync"
import { BSIM_FORMATS } from "../lib/bsim-data"
import { BSIM_FOCUS_CUT, BSIM_PAGE_NARROW, BSIM_SEG_FOCUS, BSIM_STATE, BsimChip } from "../components/bsim-kit"

/**
 * `mine` is this device's replays MERGED with the account's.
 *
 * Neither half is complete. The device holds everything played offline, which
 * is most of them and the only thing that works with no network. The account
 * holds PvP battles and anything uploaded from another machine. They are merged
 * on `clientId` so a replay this device uploaded appears once rather than twice.
 *
 * `recent` is the public league feed, and needs a network.
 */
type Scope = "recent" | "mine"

/** How many rows are on screen before the list asks whether you want more. */
const PAGE = 40

/** What a row needs, whichever side it came from. */
interface ReplayRow {
  id: string
  side1: string
  side2: string
  winner: string
  format?: string
  /** Epoch ms. Formatted at render — sorting a localised string is not a sort. */
  playedAt: number
  local: boolean
}

/** The league endpoint goes through the API's response envelope. */
interface Envelope<T> {
  data: T
}

interface LeagueReplay {
  id: number
  side1: string
  side2: string
  winner: string
  createdAt: string
}

export function ReplaysView() {
  const t = useToolT(BATTLESIM_NS)
  const nav = useBsimNav()
  const online = useToolOnline()

  const [scope, setScope] = useState<Scope>("mine")
  const [rows, setRows] = useState<ReplayRow[] | null>(null)
  const [error, setError] = useState(false)
  const [q, setQ] = useState("")
  const [visible, setVisible] = useState(PAGE)
  const [pendingDelete, setPendingDelete] = useState<ReplayRow | null>(null)
  // A retry is a re-run of the fetch effect, and the effect keys off scope and
  // connectivity — neither of which changed when the request failed. Bumping a
  // nonce is the only handle the list has on "do that again".
  const [nonce, setNonce] = useState(0)
  const retry = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let alive = true
    setRows(null)
    setError(false)
    setVisible(PAGE)

    if (scope === "mine") {
      // Local first, then merged with whatever the account holds. The server
      // knows about PvP battles and about replays uploaded from another device;
      // this device knows about everything played offline. Neither is complete
      // on its own, and the local copy is the one that always exists.
      void (async () => {
        const local = await listReplays().catch(() => [])
        const server = await fetchServerReplays()
        if (!alive) return

        const merged = new Map<string, ReplayRow>()
        for (const r of local) {
          merged.set(r.id, {
            id: r.id,
            side1: r.p1,
            side2: r.p2,
            winner: r.winner,
            format: r.format,
            playedAt: r.playedAt,
            local: true,
          })
        }
        for (const r of server ?? []) {
          // Keyed on clientId so a replay this device uploaded is ONE row, not
          // one local and one remote copy of the same battle.
          if (merged.has(r.clientId)) continue
          merged.set(r.clientId, {
            id: r.id,
            side1: r.p1Name,
            side2: r.p2Name,
            winner: r.winner ?? "",
            format: r.format,
            playedAt: r.playedAt,
            local: false,
          })
        }
        setRows([...merged.values()].sort((a, b) => b.playedAt - a.playedAt))
      })()
      return () => {
        alive = false
      }
    }

    // The league feed is a network read and nothing else. With no connection it
    // gets an OFFLINE state, not the "no replays yet" empty it used to show —
    // there may be hundreds; we simply cannot see them.
    if (!online) {
      setRows([])
      return () => {
        alive = false
      }
    }

    // `.data`: this controller is enveloped (`{success, statusCode, data}`) and
    // `toolApi().request` hands back the raw body without unwrapping it.
    toolApi()
      .request<Envelope<LeagueReplay[]>>("/smartrotom/liga/replays/recent", {
        query: { limit: 200 },
      })
      .then((res) => {
        if (!alive) return
        const list = Array.isArray(res?.data) ? res.data : []
        setRows(
          list.map((r) => ({
            id: String(r.id),
            side1: r.side1,
            side2: r.side2,
            winner: r.winner,
            playedAt: r.createdAt ? new Date(r.createdAt).getTime() : 0,
            local: false,
          })),
        )
      })
      .catch(() => {
        if (alive) setError(true)
      })

    return () => {
      alive = false
    }
  }, [scope, online, nonce])

  const filtered = useMemo(() => {
    if (!rows) return []
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((r) => `${r.side1} ${r.side2} ${r.winner}`.toLowerCase().includes(needle))
  }, [rows, q])

  const shown = filtered.slice(0, visible)
  const offlineFeed = scope === "recent" && !online

  const share = useCallback(
    (r: ReplayRow) => {
      const url = nav.shareUrl("replayDetail", { id: r.id, source: r.local ? "local" : "liga" })
      void (async () => {
        try {
          await navigator.clipboard.writeText(url)
          toast.success(t("hub.replays.shared"))
        } catch {
          toast.error(t("hub.replays.shareFailed"))
        }
      })()
    },
    [nav, t],
  )

  const confirmDelete = useCallback(async () => {
    const target = pendingDelete
    setPendingDelete(null)
    if (!target) return
    await removeReplay(target.id).catch(() => { /* already gone */ })
    setRows((prev) => (prev ? prev.filter((r) => !(r.local && r.id === target.id)) : prev))
    toast.success(t("hub.replays.deleted"))
  }, [pendingDelete, t])

  return (
    <div className={cn(BSIM_PAGE_NARROW, "flex flex-col gap-3")}>
      <div className="flex flex-wrap items-center gap-2">
        <DkSearch
          value={q}
          onChange={setQ}
          placeholder={t("replays.search")}
          ariaLabel={t("replays.search")}
          className="min-w-[11.25rem] flex-1"
        />
        <DkSeg
          value={scope}
          onChange={(v) => setScope(v as Scope)}
          ariaLabel={t("replays.scope")}
          className={BSIM_SEG_FOCUS}
          options={[
            { value: "mine", label: t("replays.mine") },
            { value: "recent", label: t("replays.recent") },
          ]}
        />
      </div>

      {rows === null && <DkSkelList rows={6} h={64} />}

      {offlineFeed && (
        <Banner
          tone="warn"
          icon="globe"
          title={t("hub.replays.offlineTitle")}
          actions={<Button size="sm" onClick={() => setScope("mine")}>{t("hub.replays.showMine")}</Button>}
        >
          {t("hub.replays.offlineLead")}
        </Banner>
      )}

      {error && (
        // No action used to be offered here at all — a dead end that said
        // only that something went wrong. Re-running the effect is what the
        // user would do by reloading, so the button does it for them.
        <DkEmpty icon="alert" title={t("replays.errorTitle")} lead={t("replays.errorLead")} className={BSIM_STATE}>
          <Button size="sm" variant="pri" icon="refresh" onClick={retry}>
            {t("hub.queue.retry")}
          </Button>
        </DkEmpty>
      )}

      {rows !== null && !error && !offlineFeed && filtered.length === 0 && (
        <DkEmpty icon="play" title={t("replays.emptyTitle")} lead={q ? t("replays.emptySearch") : t("replays.emptyLead")} className={BSIM_STATE}>
          {q ? (
            <Button size="sm" icon="x" onClick={() => setQ("")}>
              {t("hub.replays.clearSearch")}
            </Button>
          ) : (
            <Button size="sm" variant="pri" icon="target" onClick={() => nav.replace("hub", { tab: "lobby" })}>
              {t("hub.replays.goPlay")}
            </Button>
          )}
        </DkEmpty>
      )}

      {rows !== null && !error && filtered.length > 0 && (
        <>
          <ul className="grid list-none gap-[0.4375rem] p-0">
            {shown.map((r) => (
              <ReplayRowItem
                key={`${r.local ? "l" : "r"}:${r.id}`}
                r={r}
                t={t}
                onOpen={() => nav.push("replayDetail", { id: r.id, source: r.local ? "local" : "liga" })}
                onShare={() => share(r)}
                onDelete={r.local ? () => setPendingDelete(r) : undefined}
              />
            ))}
          </ul>

          {/* A list that silently stops at forty is a list that lies about how
              much there is. */}
          {filtered.length > shown.length && (
            <div className="flex items-center justify-center gap-3 pt-1">
              <Button size="sm" icon="chevronDown" onClick={() => setVisible((v) => v + PAGE)}>
                {t("hub.replays.loadMore")}
              </Button>
              <span className="font-mono text-[0.625rem]/none tabular-nums text-txt-dim">
                {t("hub.replays.shown", { shown: shown.length, total: filtered.length })}
              </span>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        tone="error"
        title={t("hub.replays.deleteTitle")}
        body={t("hub.replays.deleteBody")}
        confirmLabel={t("hub.replays.delete")}
        onConfirm={() => void confirmDelete()}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  )
}

type T = (key: string, values?: Record<string, string | number | Date>) => string

function ReplayRowItem({
  r,
  t,
  onOpen,
  onShare,
  onDelete,
}: {
  r: ReplayRow
  t: T
  onOpen: () => void
  onShare: () => void
  onDelete?: () => void
}) {
  const fmt = useFormat()
  const p1Won = !!r.winner && r.winner === r.side1
  const p2Won = !!r.winner && r.winner === r.side2
  const formatLabel = r.format ? (BSIM_FORMATS.find((f) => f.value === r.format)?.label ?? r.format) : null

  return (
    // Relative, and the menu sits OUTSIDE the row button: a button inside a
    // button is invalid, and browsers resolve it by dropping one of them.
    <li className="relative">
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "cut-tag cut-tag-edge hover:[--cut-line:var(--accent-line)] [--cut-tag:10px] group flex w-full items-center gap-3 border border-solid border-line bg-panel py-3 pl-4 pr-[3.25rem] text-left transition-[border-color,background,transform] duration-[140ms] hover:-translate-y-px hover:border-accent-line hover:bg-panel-2 motion-reduce:hover:translate-y-0",
          BSIM_FOCUS_CUT,
        )}
      >
        <span className="grid min-w-0 flex-1 gap-[0.25rem]">
          <span className="flex min-w-0 items-center gap-2 font-display text-[0.875rem] font-bold uppercase leading-none tracking-[0.03em]">
            <b className={cn("min-w-0 truncate", p1Won ? "text-accent-bright" : "text-txt")}>{r.side1}</b>
            <span className="flex-none font-mono text-[0.625rem] font-semibold uppercase text-txt-dim">{t("header.vs")}</span>
            <b className={cn("min-w-0 truncate", p2Won ? "text-accent-bright" : "text-txt")}>{r.side2}</b>
          </span>
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.625rem]/none text-txt-dim">
            {/* Icon AND word: "local" vs "account" was carried by the border
                colour alone before, which is no signal at all for a third of
                readers. */}
            <BsimChip tone={r.local ? "neutral" : "accent"} size="xs" icon={r.local ? "cube" : "globe"}>
              {r.local ? t("hub.replays.sourceLocal") : t("hub.replays.sourceAccount")}
            </BsimChip>
            {formatLabel && <span className="min-w-0 truncate">{formatLabel}</span>}
            {r.winner && (
              <span className="inline-flex min-w-0 items-center gap-1 text-ok">
                <Icon name="trophy" size={11} className="flex-none" />
                <span className="min-w-0 truncate">{t("replays.winner")}: {r.winner}</span>
              </span>
            )}
            {r.playedAt > 0 && <span className="flex-none tabular-nums">{fmt.timeAgo(r.playedAt)}</span>}
          </span>
        </span>
        <Icon name="play" size={14} className="flex-none text-txt-dim transition-colors duration-[140ms] group-hover:text-accent-bright" />
      </button>

      <span className="absolute right-[0.625rem] top-1/2 -translate-y-1/2">
        <Menu
          size="sm"
          variant="ghost"
          icon="more"
          label=""
          align="end"
          ariaLabel={t("hub.replays.rowActions")}
          items={
            onDelete
              ? [
                  { label: t("hub.replays.share"), icon: "copy", onSelect: onShare },
                  { sep: true },
                  { label: t("hub.replays.delete"), icon: "trash", danger: true, onSelect: onDelete },
                ]
              : [
                  { label: t("hub.replays.share"), icon: "copy", onSelect: onShare },
                  { sep: true },
                  // No DELETE route exists for account replays on the API, so
                  // there is no honest button to offer — only the reason why.
                  { header: t("hub.replays.deleteRemoteNote") },
                ]
          }
        />
      </span>
    </li>
  )
}
