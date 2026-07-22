import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Panel, Tag } from "../../_components/ui"
import type { TypeStatus } from "../_utils/compare"

export interface TypeTrackerProps {
  types: string[]
  statuses: Record<string, TypeStatus>
  /** Null until a guess proves whether the hidden creature has a second type. */
  isDoubleType: boolean | null
}

const STATUS_SKIN: Record<TypeStatus, string> = {
  possible: "border-ar-violet/40 bg-ar-violet/[.12] text-ar-violet-2",
  correct: "border-ar-lime/55 bg-ar-lime/[.14] text-ar-lime",
  present: "border-ar-amber/55 bg-ar-amber/[.16] text-ar-amber",
  incorrect: "border-white/[.08] bg-white/[.03] text-ar-ink-muted line-through opacity-60",
}

/** What every guess so far has proved about the hidden creature's types. */
export function TypeTracker({ types, statuses, isDoubleType }: TypeTrackerProps) {
  const t = useTranslations("arcade")
  const tPokedex = useTranslations("pokedex")

  return (
    <Panel tone="void" tight>
      <div className="mb-2.5 font-ar-display text-[9px] uppercase text-ar-magenta-2">{t("squirdle.typeTracker.title")}</div>
      <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
        {types.map((type) => {
          const status = statuses[type] ?? "possible"
          return (
            <li key={type}>
              <span
                className={cn(
                  "inline-flex items-center rounded-[5px] border px-[7px] py-[3px]",
                  "font-ar-mono text-[10px] font-bold uppercase tracking-[0.08em]",
                  STATUS_SKIN[status],
                )}
              >
                {tPokedex(`type_${type}`)}
                <span className="sr-only">: {t(`squirdle.typeTracker.status.${status}`)}</span>
              </span>
            </li>
          )
        })}
      </ul>
      {isDoubleType !== null && (
        <div className="mt-3">
          <Tag tone={isDoubleType ? "violet" : "amber"} size="md">
            {isDoubleType ? t("squirdle.typeTracker.doubleType") : t("squirdle.typeTracker.singleType")}
          </Tag>
        </div>
      )}
    </Panel>
  )
}
