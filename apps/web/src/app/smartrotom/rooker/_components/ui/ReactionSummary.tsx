"use client"

import { useTranslations } from "next-intl"
import { ReactionGlyph } from "./ReactionGlyph"
import { REACTIONS, totalReactions, type ReactionCounts } from "../../_utils/reactions"
import { useFormat } from "../../_hooks/useFormat"

/**
 * The facepile of reaction *types* on a post's detail view — "what did people feel",
 * ranked, rather than a single total.
 *
 * Only the four heaviest are drawn; past that the discs overlap into a smear and stop
 * carrying information. Reactions nobody left are omitted entirely, so a post with one
 * heart shows one heart, not five slots with four zeroes.
 */
export function ReactionSummary({ reactions }: { reactions: ReactionCounts }) {
  const t = useTranslations("rooker")
  const { fmt } = useFormat()
  const present = REACTIONS.filter((r) => reactions[r.type] > 0).sort(
    (a, b) => reactions[b.type] - reactions[a.type],
  )
  if (!present.length) return null

  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {present.slice(0, 4).map((r, i) => (
          <span
            key={r.type}
            title={`${t(`reactions.${r.type}`)} · ${fmt(reactions[r.type])}`}
            className="grid h-[22px] w-[22px] place-items-center rounded-full border-2 border-rk-bg bg-rk-card first:ml-0 [&:not(:first-child)]:-ml-[5px]"
            style={{ zIndex: 10 - i }}
          >
            <ReactionGlyph type={r.type} size={13} active />
          </span>
        ))}
      </div>
      <span className="text-[13px] font-semibold text-rk-fg-subtle">{fmt(totalReactions(reactions))}</span>
    </div>
  )
}
