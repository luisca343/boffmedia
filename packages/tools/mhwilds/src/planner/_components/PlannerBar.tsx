"use client"

import { useToolT } from "../../i18n"
import { Button, Icon, IconButton } from "@boffmedia/ui"
import { MhBar, MhBarSide, MhModes, MhSeal } from "../../ui/mh-kit"

export function PlannerBar({
  name, onName, filled, total, skillCount, mode, onMode, onOpenSaved, onIo, onShare, onReset, onSave,
}: {
  name: string; onName: (v: string) => void; filled: number; total: number; skillCount: number
  mode: "build" | "compare"; onMode: (m: string) => void
  onOpenSaved: () => void; onIo: () => void; onShare: () => void; onReset: () => void; onSave: () => void
}) {
  const t = useToolT("tools.mhwilds")
  return (
    <MhBar>
      <div className="flex items-center gap-[0.6875rem] min-w-0">
        <MhSeal name="sword" />
        <div className="min-w-0 flex flex-col gap-px">
          <input
            /* Typography matches `ToolTitle` exactly (17px display bold uppercase,
               tracking .04em). It stays an <input> rather than becoming the
               primitive because this title is the build's editable name. */
            className="font-display text-[1.0625rem] leading-[1.05] font-bold uppercase tracking-[0.04em] text-txt bg-transparent border-0 border-b-[1.5px] border-dashed border-transparent hover:border-line-2 focus:border-[var(--mh)] outline-none py-[3px] px-0.5 min-w-[3.75rem] max-w-[42vw]"
            value={name}
            onChange={(e) => onName(e.target.value)}
            aria-label={t("build_planner.build_name_placeholder")}
            spellCheck={false}
          />
          <div className="font-mono text-[0.6875rem] leading-tight text-txt-muted tracking-[0.02em] truncate">
            {t("build_planner.piecesCount", { filled, total })} · {t("build_planner.skill_count", { count: skillCount })}
          </div>
        </div>
      </div>
      <MhBarSide>
        <MhModes
          value={mode}
          onChange={onMode}
          options={[
            { value: "build", label: <><Icon name="wrench" size={13} />{t("build_planner.compare.mode_edit")}</> },
            { value: "compare", label: <><Icon name="layers" size={13} />{t("build_planner.compare.mode_compare")}</> },
          ]}
        />
        <Button size="sm" icon="bookmark" onClick={onOpenSaved}>{t("build_planner.saved_builds")}</Button>
        <Button size="sm" icon="download" onClick={onIo}>{t("build_planner.import_export")}</Button>
        <Button size="sm" icon="link" onClick={onShare}>{t("build_planner.share")}</Button>
        <IconButton name="refresh" label={t("build_planner.reset")} onClick={onReset} />
        <Button size="sm" variant="pri" icon="check" onClick={onSave}>{t("build_planner.save")}</Button>
      </MhBarSide>
    </MhBar>
  )
}
