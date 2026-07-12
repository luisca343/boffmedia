"use client"

import { useTranslations } from "next-intl"
import { Button, Icon, IconButton } from "@/components/boffmedia/primitives"
import { MhBar, MhBarSide, MhModes, MhSeal } from "../../../_components/ui/mh-kit"

export function PlannerBar({
  name, onName, filled, total, skillCount, mode, onMode, onOpenSaved, onIo, onShare, onReset, onSave,
}: {
  name: string; onName: (v: string) => void; filled: number; total: number; skillCount: number
  mode: "build" | "compare"; onMode: (m: string) => void
  onOpenSaved: () => void; onIo: () => void; onShare: () => void; onReset: () => void; onSave: () => void
}) {
  const t = useTranslations("mhwilds")
  return (
    <MhBar>
      <div className="flex items-center gap-[11px] min-w-0">
        <MhSeal name="sword" />
        <div className="min-w-0 flex flex-col gap-px">
          <input
            className="font-display text-[17px] leading-none font-bold uppercase tracking-[0.02em] text-txt bg-transparent border-0 border-b-[1.5px] border-dashed border-transparent hover:border-line-2 focus:border-[var(--mh)] outline-none py-[3px] px-0.5 min-w-[60px] max-w-[42vw]"
            value={name}
            onChange={(e) => onName(e.target.value)}
            aria-label={t("build_planner.build_name_placeholder")}
            spellCheck={false}
          />
          <div className="font-mono text-[11px] leading-tight text-txt-muted tracking-[0.02em] truncate">
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
