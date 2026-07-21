import { useTranslations } from "next-intl"
import type { WordlePokemon } from "../_hooks/useGetWordlePokemon"
import { AttemptRow } from "./AttemptRow"

export interface AttemptListProps {
  guesses: WordlePokemon[]
  target: WordlePokemon | null
  gameOver: boolean
  nameOf: (raw: string) => string
}

/** The comparison grid — every guess so far, newest last. */
export function AttemptList({ guesses, target, gameOver, nameOf }: AttemptListProps) {
  const t = useTranslations("arcade")

  if (guesses.length === 0) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-white/[.1] px-4 py-10 text-center">
        <p className="m-0 font-ar-mono text-[11px] leading-relaxed text-ar-ink-muted">
          {t("arcade.squirdle.noAttemptsYet")}
          <br />
          {t("arcade.squirdle.guessAPokemon")}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="hidden grid-cols-[76px_1fr_1.2fr_1.2fr_.9fr_.9fr] gap-2 px-0.5 md:grid">
        {["", t("arcade.squirdle.columns.type1"), t("arcade.squirdle.columns.type1"), t("arcade.squirdle.columns.type2"), t("arcade.squirdle.columns.height"), t("arcade.squirdle.columns.weight")].map((head, i) => (
          <span
            key={head || i}
            className="self-end text-center font-ar-display text-[8px] uppercase tracking-[0.1em] text-ar-ink-muted"
          >
            {head}
          </span>
        ))}
      </div>
      {guesses.map((guess, i) => (
        <AttemptRow
          key={`${guess.name}-${i}`}
          guess={guess}
          target={target}
          name={nameOf(guess.name)}
          revealed={i === guesses.length - 1 && gameOver && guess.name === target?.name}
        />
      ))}
    </div>
  )
}
