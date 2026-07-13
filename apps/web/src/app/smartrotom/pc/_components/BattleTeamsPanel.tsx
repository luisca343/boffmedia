"use client"

import { useBattleTeams, useMons } from "../_hooks/queries"
import type { ExtendedPokemonW, Mon } from "../_types/pc.types"
import { PARTY_SIZE } from "../_utils/constants"
import { displayName } from "../_utils/derive"
import { pokemonKey } from "../_utils/pokemonKey"
import { Icon, Skeleton, Sprite } from "./ui"
import { PokemonSlot } from "./PokemonSlot"

/**
 * The saved battle teams — **read-only**.
 *
 * The web service exposes create/delete/setActive, but the API controller does not
 * implement any of them: it only serves `GET` and an `update` whose real body is
 * `{ teamSlot, pokemon: { box, slot } }`, not the Pokémon array the web DTO claims.
 * Wiring editing here would be wiring phantom endpoints, so the panel shows the
 * teams and nothing more. [deferred] — needs the API controller first.
 *
 * A team slot stores a Pokémon, not a position, so each one is resolved back to the
 * `Mon` that is physically in the PC via its content hash. That is what lets the
 * slot behave like any other: click it and its real box/party location opens.
 */
export function BattleTeamsPanel() {
  const { data, isLoading } = useBattleTeams()
  const { byKey } = useMons()

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-3 p-[11px]">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-[104px] w-full" />
        ))}
      </div>
    )
  }

  const teams = data?.teams ?? []

  if (teams.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <Icon name="sword" size={22} className="text-pc-fg-subtle" />
        <p className="text-xs text-pc-fg-subtle">No tienes equipos de batalla guardados.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-[11px]">
      {teams.map((team) => {
        const slots = Array.from({ length: PARTY_SIZE }, (_, i) => team.pokemon?.[i] ?? null)
        const n = slots.filter(Boolean).length
        return (
          <div key={team.id} className="pc-glass rounded-[12px] bg-white/[.02] p-2.5">
            <div className="mb-[9px] flex items-center gap-[7px]">
              <Icon name="sword" size={14} className="text-pc-accent" />
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-pc-fg">{team.name}</span>
              {team.isActive && (
                <span className="flex-none rounded-pc-pill bg-pc-green/[.16] px-1.5 py-px font-pc-mono text-[9.5px] font-bold uppercase text-pc-green">
                  activo
                </span>
              )}
              <span className="flex-none font-pc-mono text-[10.5px] text-pc-fg-subtle">{n}/6</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {slots.map((p, i) => (
                <BattleSlot key={i} pokemon={p as ExtendedPokemonW | null} resolve={byKey} />
              ))}
            </div>
          </div>
        )
      })}
      <p className="p-1 text-center text-[11px] text-pc-fg-subtle">
        Solo lectura — los equipos de batalla se editan dentro del juego.
      </p>
    </div>
  )
}

/**
 * A team slot resolves to a real `Mon` whenever the Pokémon is still in storage.
 * When it does not (an Ability Capsule or a Bottle Cap moves a Pokémon off its
 * content hash — see `pokemonKey.ts`), the sprite is still shown, just inert: it is
 * honest about having no location to open.
 */
function BattleSlot({
  pokemon,
  resolve,
}: {
  pokemon: ExtendedPokemonW | null
  resolve: Map<string, Mon>
}) {
  if (!pokemon) {
    return <div className="pc-slot pc-slot-empty" />
  }

  const mon = resolve.get(pokemonKey(pokemon))
  if (mon) {
    return <PokemonSlot mon={mon} loc={mon.loc} />
  }

  return (
    <div className="pc-slot pc-slot-empty !cursor-default" title={displayName(pokemon)}>
      <span className="absolute inset-0 flex items-center justify-center opacity-70">
        <Sprite
          dex={pokemon.dex}
          form={pokemon.form}
          palette={pokemon.palette}
          className="h-[86%] w-[86%]"
        />
      </span>
    </div>
  )
}
