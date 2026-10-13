"use client"

import Image from "next/image"
import { SearchInput } from "@boffmedia/ui"
import { useTranslations } from "next-intl"

export interface ClassRosterCharacter { id: string; name: string; image: string }

export function ClassRoster({ characters, assignments, selectedId, onSelect, query, onQuery }: {
  characters: readonly ClassRosterCharacter[]
  assignments: Readonly<Record<string, string>>
  selectedId: string
  onSelect: (id: string) => void
  query: string
  onQuery: (value: string) => void
}) {
  const t = useTranslations("otros.fortunesWeave.classes")
  const visible = characters.filter((character) => character.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  return <section aria-label={t("roster")} className="min-w-0 border border-solid border-line bg-panel">
    <div className="grid gap-3 border-b border-solid border-line p-3">
      <h2 className="font-display text-lg">{t("roster")}</h2>
      <p className="text-xs text-txt-muted">{t("plannedCount", { count: Object.keys(assignments).length })}</p>
      <SearchInput value={query} onChange={onQuery} placeholder={t("searchCharacters")} size="sm" />
    </div>
    <div className="max-h-[20rem] overflow-y-auto overscroll-contain lg:max-h-[32rem]">
      {visible.map((character) => <button key={character.id} type="button" onClick={() => onSelect(character.id)} aria-pressed={character.id === selectedId}
        aria-label={t("rosterCharacter", { character: character.name, name: assignments[character.id] ? t(`names.${assignments[character.id]}`) : t("noClass") })}
        className={`flex w-full items-center gap-3 border-b border-solid border-line p-3 text-left transition hover:bg-base-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${selectedId === character.id ? "bg-accent-soft" : ""}`}>
        <Image src={character.image} alt="" width={36} height={36} className="h-9 w-9 flex-none object-cover" />
        <span className="min-w-0"><span className="block text-sm font-semibold text-txt">{character.name}</span>
          <span className={`block text-xs ${assignments[character.id] ? "text-accent" : "text-txt-dim"}`}>
            {assignments[character.id] ? t(`names.${assignments[character.id]}`) : t("noClass")}
          </span>
        </span>
      </button>)}
      {!visible.length && <p className="p-4 text-sm text-txt-muted">{t("noCharacters")}</p>}
    </div>
  </section>
}
