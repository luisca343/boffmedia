"use client"

import * as React from "react"
import { useToolT } from "../../i18n"
import { Empty, Icon, Spinner } from "@boffmedia/ui"
import { MhMonster } from "../../types"
import { MhDrawer, MhSearch } from "../../ui/mh-kit"
import { elementColor } from "../../ui/mh-helpers"
import { useMonsters } from "../../bestiary/useMonsters"

export function TargetDrawer({ onPick, onClose }: { onPick: (m: MhMonster) => void; onClose: () => void }) {
  const t = useToolT("tools.mhwilds")
  const { monsters, loading } = useMonsters()
  const [q, setQ] = React.useState("")

  const list = React.useMemo(() => {
    const term = q.trim().toLowerCase()
    return monsters
      .filter((m) => m.kind === "large" && (!term || m.name.toLowerCase().includes(term)))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [monsters, q])

  return (
    <MhDrawer
      iconName="skull"
      title={t("build_planner.target.drawerTitle")}
      sub={t("build_planner.optionsCount", { count: list.length })}
      onClose={onClose}
      tools={<MhSearch value={q} onChange={setQ} placeholder={t("build_planner.search")} />}
    >
      {loading ? (
        <div className="grid h-[300px] place-items-center">
          <Spinner />
        </div>
      ) : list.length === 0 ? (
        <Empty icon="search" title={t("build_planner.no_results")} lead={t("build_planner.target.drawerEmpty")} />
      ) : (
        <div className="flex flex-col gap-1.5">
          {list.map((m) => {
            const weaks = m.weaknesses.filter((w) => w.kind === "element" && w.element)
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onPick(m)}
                className="flex items-center gap-3 border border-line bg-base-2 px-3 py-2.5 text-left transition-colors hover:border-[var(--mh)]"
              >
                <span className="grid h-9 w-9 flex-none place-items-center border border-line bg-panel">
                  <Icon name="skull" size={16} className="text-txt-muted" />
                </span>
                <span className="grid min-w-0 flex-1 gap-1">
                  <span className="truncate font-display text-[14px] leading-tight font-bold uppercase not-italic">{m.name}</span>
                  <span className="inline-flex items-center gap-1.5">
                    {weaks.length ? (
                      weaks.map((w) => (
                        <span
                          key={w.id}
                          className="h-2 w-2 rounded-full"
                          style={{ background: elementColor(w.element!) }}
                          title={t(w.element!)}
                        />
                      ))
                    ) : (
                      <span className="font-mono text-[10px] uppercase text-txt-dim">{t("build_planner.target.no_elem_weak")}</span>
                    )}
                  </span>
                </span>
                <Icon name="arrow" size={14} className="shrink-0 text-txt-dim" />
              </button>
            )
          })}
        </div>
      )}
    </MhDrawer>
  )
}
