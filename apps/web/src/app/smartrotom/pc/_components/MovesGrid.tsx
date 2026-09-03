import { useTranslations } from "next-intl"
import { moveName } from "../_utils/derive"

export interface MovesGridProps {
  /**
   * Typed `string[]` upstream, but the live payload has been seen sending move
   * *objects* on some entries — hence `unknown[]` and `moveName()` on every read.
   */
  moves?: unknown[]
}

/**
 * The four moves.
 *
 * Names only. The game payload carries no move type, category or power for a stored
 * Pokémon, so the type badge and the "80 pot." line the prototype shows are omitted
 * rather than faked — they were mock data.
 */
export function MovesGrid({ moves }: MovesGridProps) {
  const t = useTranslations("pc")
  const names = (moves ?? []).map(moveName).filter((n): n is string => !!n)

  if (names.length === 0) {
    return <p className="text-xs text-pc-fg-subtle">{t("detail.none")}</p>
  }

  return (
    <div className="grid grid-cols-2 gap-[0.4375rem]">
      {names.map((name, i) => (
        <div
          key={`${name}-${i}`}
          className="rounded-[10px] border border-pc-line bg-white/[.02] px-2.5 py-2"
        >
          <span className="block truncate text-xs font-semibold text-pc-fg">{name}</span>
        </div>
      ))}
    </div>
  )
}
