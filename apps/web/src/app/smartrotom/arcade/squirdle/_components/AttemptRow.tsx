import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { PixelArt } from "../../_components/ui"
import type { WordlePokemon } from "../_hooks/useGetWordlePokemon"
import { numberFeedback, typeFeedback } from "../_utils/compare"
import { creatureSprite, toneForType } from "../_utils/creature"
import { FeedbackCell } from "./FeedbackCell"

export interface AttemptRowProps {
  guess: WordlePokemon
  target: WordlePokemon | null
  name: string
  /** The revealed answer appended when the board runs out of guesses. */
  revealed?: boolean
}

/** One guess: its creature, then a verdict per comparable attribute. */
export function AttemptRow({ guess, target, name, revealed }: AttemptRowProps) {
  const t = useTranslations("arcade")
  const tone = toneForType(guess.type1)

  return (
    <div
      className={cn(
        "grid grid-cols-5 gap-1.5 rounded-xl md:grid-cols-[76px_1fr_1.2fr_1.2fr_.9fr_.9fr] md:gap-2",
        revealed && "bg-ar-lime/[.06] p-1.5 ring-1 ring-ar-lime/40 md:p-1",
      )}
    >
      <div
        className={cn(
          "col-span-5 flex items-center gap-2.5 rounded-lg border border-white/[.08] px-2 py-1.5",
          "bg-[linear-gradient(180deg,rgb(255_255_255/.05),transparent)]",
          "md:col-span-1 md:flex-col md:justify-center md:gap-1 md:px-1",
        )}
      >
        <PixelArt sprite={creatureSprite(tone)} scale={2} className="shrink-0" />
        <span className="truncate font-ar-mono text-[10px] leading-tight text-ar-ink-dim md:text-center md:text-[8.5px]">
          {name}
        </span>
      </div>

      <FeedbackCell label={t("arcade.squirdle.columns.gen")} fb={numberFeedback(guess.gen, target?.gen ?? guess.gen)}>
        {guess.gen}
      </FeedbackCell>
      <FeedbackCell label={t("arcade.squirdle.columns.type1")} fb={typeFeedback(guess.type1, 1, target)}>
        {guess.type1 ? t(`pokedex.type_${guess.type1}`) : "—"}
      </FeedbackCell>
      <FeedbackCell label={t("arcade.squirdle.columns.type2")} fb={typeFeedback(guess.type2, 2, target)}>
        {guess.type2 ? t(`pokedex.type_${guess.type2}`) : "—"}
      </FeedbackCell>
      <FeedbackCell label={t("arcade.squirdle.columns.height")} fb={numberFeedback(guess.height, target?.height ?? guess.height)}>
        {guess.height}m
      </FeedbackCell>
      <FeedbackCell label={t("arcade.squirdle.columns.weight")} fb={numberFeedback(guess.weight, target?.weight ?? guess.weight)}>
        {guess.weight}
      </FeedbackCell>
    </div>
  )
}
