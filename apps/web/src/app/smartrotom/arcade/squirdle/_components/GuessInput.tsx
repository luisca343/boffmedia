"use client"

import type { FormEvent } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button, Icon, Input, PixelArt } from "../../_components/ui"
import type { WordlePokemon } from "../_hooks/useGetWordlePokemon"
import { MAX_GUESSES } from "../_utils/compare"
import { creatureSprite, toneForType } from "../_utils/creature"

export interface GuessInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  suggestions: WordlePokemon[]
  onPick: (pokemon: WordlePokemon) => void
  nameOf: (raw: string) => string
  attempt: number
  disabled?: boolean
}

/** The console: type a creature, pick it from the autocomplete, fire the guess. */
export function GuessInput({
  value,
  onChange,
  onSubmit,
  suggestions,
  onPick,
  nameOf,
  attempt,
  disabled,
}: GuessInputProps) {
  const t = useTranslations("arcade")
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ar-cyan"
          >
            <Icon.Search s={16} />
          </span>
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("arcade.squirdle.guessInput.placeholder")}
            aria-label={t("arcade.squirdle.guessInput.ariaLabel")}
            autoComplete="off"
            disabled={disabled}
            className={cn(
              "border-ar-cyan/40 py-3 pl-10 pr-[104px] font-ar text-[14px]",
              "shadow-[inset_0_0_22px_rgb(var(--ar-cyan)/.15)]",
            )}
          />
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-ar-display text-[8px] text-ar-ink-muted">
            {Math.min(attempt, MAX_GUESSES)} / {MAX_GUESSES}
          </span>
        </div>
        <Button type="submit" variant="cyan" size="md" disabled={disabled}>
          {t("arcade.squirdle.guessInput.guess")}
        </Button>
      </div>

      {suggestions.length > 0 && !disabled && (
        <ul
          className={cn(
            "ar-scroll absolute inset-x-0 top-[calc(100%_+_6px)] z-20 max-h-64 overflow-y-auto rounded-[10px] border border-ar-cyan/30 p-1.5",
            "bg-[linear-gradient(180deg,rgb(12_7_38/.98),rgb(6_3_22/.98))] shadow-[0_20px_50px_-16px_rgb(0_0_0/.8)]",
          )}
        >
          {suggestions.map((pokemon) => (
            <li key={pokemon.name}>
              <button
                type="button"
                onClick={() => onPick(pokemon)}
                className={cn(
                  "ar-lift flex w-full items-center gap-2.5 rounded-[7px] border border-transparent px-2.5 py-2 text-left",
                  "hover:border-ar-cyan/35 hover:bg-[linear-gradient(90deg,rgb(var(--ar-cyan)/.16),transparent)]",
                )}
              >
                <PixelArt sprite={creatureSprite(toneForType(pokemon.type1))} scale={2} />
                <span className="flex-1 truncate font-ar text-[14px] font-semibold text-ar-ink-dim">
                  {nameOf(pokemon.name)}
                </span>
                <span className="font-ar-display text-[8px] text-ar-ink-muted">
                  GEN {pokemon.gen}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
