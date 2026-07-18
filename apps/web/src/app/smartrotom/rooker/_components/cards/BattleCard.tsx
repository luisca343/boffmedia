"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Avatar, Icon } from "../ui"
import { useFormat } from "../../_hooks/useFormat"
import type { RookerAuthor, RookerBattle } from "../../_types"

/**
 * A battle result, attached to a trino — read straight off `rotom_replays`.
 *
 * The card is written from the POSTER's point of view: whoever attached the replay is
 * the left-hand side, and VICTORIA/DERROTA is relative to them, not to `side1`. A
 * replay where `winner` is null is a draw or an unfinished match, and the card says so
 * rather than defaulting to a loss.
 *
 * [deferred] The handoff also showed a score line ("3 – 2"), the format, the duration
 * and an MVP Pokémon. `rotom_replays` stores none of them — only the two sides, the
 * winner and the serialised replay — so they are omitted rather than invented. The
 * "Ver repetición" button is real: it deep-links into the Liga's replay viewer, which
 * already exists.
 */
export function BattleCard({ data, author }: { data: RookerBattle; author: RookerAuthor }) {
  const t = useTranslations("rooker")
  const { relTime } = useFormat()
  const rival = t("card.battle.rival")
  const mine = data.side1 === author.uuid ? data.side1 : data.side2
  const theirs = mine === data.side1 ? data.side2 : data.side1

  const decided = Boolean(data.winner)
  const won = decided && data.winner === mine

  const tone = !decided ? "text-rk-fg-muted" : won ? "text-rk-accent" : "text-rk-ball"
  const edge = !decided ? "border-rk-line-strong" : won ? "border-rk-accent/35" : "border-rk-ball/35"
  const wash = !decided ? "from-rk-elevated" : won ? "from-rk-accent/12" : "from-rk-ball/12"

  return (
    <div className={cn("overflow-hidden rounded-rk border bg-gradient-to-b to-rk-card", edge, wash)}>
      <div className="flex items-center justify-between border-b border-rk-line px-3.5 py-2.5">
        <span className={cn("inline-flex items-center gap-1.5 text-[15px] font-extrabold tracking-[.02em]", tone)}>
          <Icon name="sword" size={16} />
          {!decided ? t("card.battle.undecided") : won ? t("card.battle.victory") : t("card.battle.defeat")}
        </span>
        <span className="text-[11.5px] font-semibold text-rk-fg-muted">{relTime(data.createdAt)}</span>
      </div>

      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="flex flex-1 flex-col items-center gap-1.5">
          <Avatar user={{ uuid: mine, username: author.username, partnerPokemonId: author.partnerPokemonId }} size={42} />
          <span className="max-w-full truncate text-[12px] font-bold text-rk-fg">
            {author.displayName || author.username}
          </span>
        </div>

        <span className="text-[13px] font-extrabold uppercase tracking-widest text-rk-fg-subtle">{t("card.battle.vs")}</span>

        <div className="flex flex-1 flex-col items-center gap-1.5">
          <Avatar user={{ uuid: theirs, username: rival, partnerPokemonId: null }} size={42} />
          <span className="max-w-full truncate text-[12px] font-bold text-rk-fg">{rival}</span>
        </div>
      </div>

      <div className="px-3.5 pb-3.5">
        <Link
          href={`/smartrotom/liga/camaralucha/ver/${data.replayId}`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-rk-pill border bg-rk-fg/5 px-3.5 py-1.5 text-[12.5px] font-bold transition-colors hover:bg-rk-hover",
            decided && won ? "border-rk-accent/40 text-rk-accent" : "border-rk-line-strong text-rk-fg",
          )}
        >
          <Icon name="play" size={12} fill />
          {t("card.battle.viewReplay")}
        </Link>
      </div>
    </div>
  )
}
