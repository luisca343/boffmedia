"use client"

import Fuse from "fuse.js"
import { useTranslations } from "next-intl"
import { useCallback, useMemo, useState } from "react"
import { MAX_GUESSES, checkType, type TypeStatus } from "../_utils/compare"
import { useGetWordlePokemon, type WordlePokemon } from "./useGetWordlePokemon"

const initialStatuses = (types: string[]): Record<string, TypeStatus> =>
  Object.fromEntries(types.map((type) => [type, "possible" as TypeStatus]))

/**
 * The whole game: the board state, the guess pipeline and the running type
 * tracker. The hidden creature is drawn client-side from the wordle list — the
 * endpoint serves the pool, never the answer.
 */
export function useSquirdleGame() {
  const t = useTranslations("pokedex")
  const tArcade = useTranslations("arcade")
  const { pokemonData, allTypes, targetPokemon, pickTarget } = useGetWordlePokemon()

  const [guesses, setGuesses] = useState<WordlePokemon[]>([])
  const [currentGuess, setCurrentGuess] = useState("")
  const [suggestions, setSuggestions] = useState<WordlePokemon[]>([])
  const [message, setMessage] = useState("")
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [isDoubleType, setIsDoubleType] = useState<boolean | null>(null)
  const [typeStatuses, setTypeStatuses] = useState<Record<string, TypeStatus>>(() =>
    initialStatuses(allTypes),
  )

  const nameOf = useCallback(
    (raw: string | undefined) => {
      if (!raw) return ""
      let [pokemonName, formName] = raw.split("_")
      if (pokemonName === "ho-oh") pokemonName = "ho_oh"
      if (pokemonName === "porygon-z") pokemonName = "porygon_z"

      const translated = t(`pixelmon_${pokemonName}`)
      if (formName === "base") return translated
      return `${translated} (${t(`form_${formName}`)})`
    },
    [t],
  )

  // Memoised on the data: the pool is ~1k entries, so rebuilding the index on
  // every keystroke is pure waste.
  const fuse = useMemo(
    () => new Fuse(pokemonData, { keys: ["name", "transName"], threshold: 0.4 }),
    [pokemonData],
  )

  const onGuessChange = useCallback(
    (value: string) => {
      setCurrentGuess(value)
      setSuggestions(value.length > 1 ? fuse.search(value).map((r) => r.item) : [])
    },
    [fuse],
  )

  const pickSuggestion = useCallback(
    (pokemon: WordlePokemon) => {
      setCurrentGuess(nameOf(pokemon.name))
      setSuggestions([])
    },
    [nameOf],
  )

  const submitGuess = useCallback(() => {
    if (gameOver || !targetPokemon) return

    const guessed = pokemonData.find((p) => nameOf(p.name.toLowerCase()) === currentGuess)
    if (!guessed) {
      setMessage(tArcade("squirdle.invalidGuess"))
      return
    }

    const next = [...guesses, guessed]
    setGuesses(next)
    setCurrentGuess("")
    setSuggestions([])

    if (guessed.name === targetPokemon.name) {
      setMessage(tArcade("squirdle.wonMessage", { name: nameOf(targetPokemon.name) }))
      setWon(true)
      setGameOver(true)
    } else if (next.length >= MAX_GUESSES) {
      setMessage(tArcade("squirdle.lostMessage", { name: nameOf(targetPokemon.name) }))
      setGuesses([...next, targetPokemon])
      setGameOver(true)
    } else {
      setMessage("")
    }

    setTypeStatuses((current) => {
      const updated = { ...current }
      updated[guessed.type1] = checkType(guessed.type1, 1, targetPokemon)
      if (guessed.type2) updated[guessed.type2] = checkType(guessed.type2, 2, targetPokemon)
      return updated
    })

    setIsDoubleType((current) => {
      if (current !== null) return current
      const known =
        guessed.type2 === targetPokemon.type2 ||
        checkType(guessed.type1, 1, targetPokemon) === "present" ||
        (checkType(guessed.type2, 2, targetPokemon) === "incorrect" && guessed.type2 === undefined)
      return known ? true : current
    })
  }, [currentGuess, gameOver, guesses, nameOf, pokemonData, tArcade, targetPokemon])

  const reset = useCallback(() => {
    setGuesses([])
    setCurrentGuess("")
    setSuggestions([])
    setMessage("")
    setGameOver(false)
    setWon(false)
    setIsDoubleType(null)
    setTypeStatuses(initialStatuses(allTypes))
    pickTarget()
  }, [allTypes, pickTarget])

  return {
    allTypes,
    currentGuess,
    gameOver,
    guesses,
    isDoubleType,
    loading: !targetPokemon,
    message,
    nameOf,
    onGuessChange,
    pickSuggestion,
    remaining: Math.max(0, MAX_GUESSES - guesses.length),
    reset,
    submitGuess,
    suggestions,
    target: targetPokemon,
    typeStatuses,
    won,
  }
}
