"use client"

import { useTranslations } from "next-intl"
import { Icon } from "@boffmedia/ui"
import { cn } from "@/lib/utils"
import { AvPill, AvProgressBar } from "../../_components/ui/av-kit"
import type { TcgSyncSetState, TcgSyncSetStatus } from "@/services/api/boffmedia/ptcgpService"

/** Live state of one set during a run, keyed by set id in the parent. */
export interface SetRunState {
  state: "pending" | "running" | "done" | "skipped" | "error"
  done?: number
  total?: number
  message?: string
  /** Cards upstream publishes no artwork for — a result, not a problem. */
  unavailable?: number
}

const STATE_TONE: Record<TcgSyncSetState, "green" | "amber" | "rose" | "default"> = {
  ok: "green",
  "images-partial": "amber",
  "cards-partial": "amber",
  missing: "rose",
}

/**
 * The expansion list, doubling as the progress view.
 *
 * Selecting and watching are the same table on purpose: during a run the rows an
 * admin ticked are the rows that fill in, so there is never a question of which
 * expansion the progress bar is talking about.
 */
export function SetSyncTable({
  sets,
  selected,
  onToggle,
  disabled,
  runState,
}: {
  sets: TcgSyncSetStatus[]
  selected: Set<string>
  onToggle: (id: string) => void
  disabled?: boolean
  runState?: Record<string, SetRunState>
}) {
  const t = useTranslations("admin.tcgp")

  if (sets.length === 0) {
    return <p className="py-2 text-[13px] text-txt-muted">{t("noSets")}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="border-b border-solid border-line text-left font-mono text-[9.5px] uppercase tracking-[0.1em] text-txt-dim">
            <th className="w-8 py-2 pr-2 font-semibold" />
            <th className="py-2 pr-3 font-semibold">{t("colSet")}</th>
            <th className="w-[168px] py-2 pr-3 font-semibold">{t("colCards")}</th>
            <th className="w-[168px] py-2 pr-3 font-semibold">{t("colImages")}</th>
            <th className="w-[132px] py-2 font-semibold">{t("colState")}</th>
          </tr>
        </thead>
        <tbody>
          {sets.map((set) => {
            const run = runState?.[set.id]
            const isChecked = selected.has(set.id)
            // Cards with artwork, out of cards stored - not files, because many
            // cards only ever get one locale's asset.
            const imagesTotal = set.cardsInDb
            const imagesHave = set.imagesAny

            return (
              <tr
                key={set.id}
                className={cn(
                  "border-b border-dashed border-line last:border-b-0",
                  run?.state === "running" && "bg-accent-soft",
                  !isChecked && !run && "opacity-60",
                )}
              >
                <td className="py-2 pr-2 align-middle">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={disabled}
                    onChange={() => onToggle(set.id)}
                    aria-label={set.name}
                    className="h-3.5 w-3.5 accent-[var(--accent)] disabled:opacity-40"
                  />
                </td>

                <td className="py-2 pr-3 align-middle">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-txt-dim">
                      {set.id}
                    </span>
                    <span className="truncate text-txt">{set.name}</span>
                  </div>
                  {run?.message && (
                    <p
                      className={cn(
                        "m-0 mt-0.5 truncate font-mono text-[10.5px]",
                        run.state === "error" ? "text-bad" : "text-txt-dim",
                      )}
                      title={run.message}
                    >
                      {run.message}
                    </p>
                  )}
                  {/* Nothing to download is a finished result; say so, or the
                      row looks like it silently did nothing. */}
                  {!run?.message && run?.unavailable ? (
                    <p className="m-0 mt-0.5 truncate font-mono text-[10.5px] text-txt-dim">
                      {t("noArtworkUpstream", { count: run.unavailable })}
                    </p>
                  ) : null}
                </td>

                <td className="py-2 pr-3 align-middle">
                  <AvProgressBar
                    value={set.cardsInDb}
                    max={Math.max(set.cardsRemote, set.cardsInDb, 1)}
                    tone={set.cardsRemote > 0 && set.cardsInDb >= set.cardsRemote ? "green" : "amber"}
                    label={`${set.cardsInDb}/${set.cardsRemote || "?"}`}
                  />
                </td>

                <td className="py-2 pr-3 align-middle">
                  <AvProgressBar
                    value={imagesHave}
                    max={Math.max(imagesTotal, 1)}
                    tone={set.imagesMissing === 0 && imagesTotal > 0 ? "green" : "amber"}
                    label={`${imagesHave}/${imagesTotal}`}
                  />
                </td>

                <td className="py-2 align-middle">
                  {run ? <RunPill run={run} /> : <AvPill tone={STATE_TONE[set.state]}>{t(`state.${set.state}`)}</AvPill>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function RunPill({ run }: { run: SetRunState }) {
  const t = useTranslations("admin.tcgp")

  if (run.state === "running") {
    const label =
      run.total && run.total > 0 ? `${run.done ?? 0}/${run.total}` : t("run.running")
    return (
      <AvPill tone="accent">
        <Icon name="refresh" size={11} className="animate-spin motion-reduce:animate-none" />
        {label}
      </AvPill>
    )
  }
  if (run.state === "done") return <AvPill tone="green">{t("run.done")}</AvPill>
  if (run.state === "skipped") return <AvPill tone="muted">{t("run.skipped")}</AvPill>
  if (run.state === "error") return <AvPill tone="rose">{t("run.failed")}</AvPill>
  return <AvPill tone="default">{t("run.pending")}</AvPill>
}
