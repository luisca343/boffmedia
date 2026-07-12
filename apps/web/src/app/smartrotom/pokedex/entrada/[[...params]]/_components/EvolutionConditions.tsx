import React from "react"
import { Evolution } from "@/types/Pokemon"
import { InformationCircleIcon } from "@heroicons/react/24/outline"
import { ItemSprite } from "../../../_components/PokemonSprite"

export function getEvolutionMethod(evolution: Evolution, t: any) {
  const conditions = [] as React.ReactNode[]

  switch (evolution.evoType) {
    case "interact":
      const [, itemId] = evolution.item?.itemID.split(":") || []
      conditions.push(
        <div className="flex items-center justify-center" key="interact">
          <span className="mx-1">{t(`evolution_interact`, { item: t(`item_${itemId}`) })}</span>
          <ItemSprite name={itemId} width={30} height={30} />
        </div>
      )
      break
    case "leveling":
      if (evolution.level)
        conditions.push(<span key="leveling" className="font-medium">{t(`evolution_level`, { level: evolution.level })}</span>)
      else conditions.push(<span key="leveling" className="font-medium">{t(`evolution_leveling`)}</span>)
      break
    case "trade":
      conditions.push(<span key="trade" className="font-medium">{t(`evolution_trade`)}</span>)
      break
    case "ticking":
      conditions.push(<span key="ticking" className="font-medium">{t(`evolution_ticking`)}</span>)
      break
    case "emptyslot":
      conditions.push(<span key="emptyslot" className="font-medium">{t(`evolution_emptyslot`)}</span>)
      break
    default:
      conditions.push(<span key="default" className="font-medium">{evolution.evoType}</span>)
  }

  if (evolution.conditions?.length > 0) {
    evolution.conditions.forEach((condition, index) => {
      addConditionByType(condition, `${condition.evoConditionType}-${index}`, conditions, t)
    })
  }

  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      {conditions.map((condition, i) => (
        <div key={`cond-${i}`} className="text-[11px] text-pk-surface-200 leading-tight">
          {condition}
        </div>
      ))}
    </div>
  )
}

function addConditionByType(condition: any, conditionKey: string, conditions: React.ReactNode[], t: any) {
  const conditionType = condition.evoConditionType

  switch (conditionType) {
    case "friendship":
      conditions.push(<span key={conditionKey}>{t(`evolution_friendship`, { value: condition.friendship })}</span>)
      break
    case "time":
      conditions.push(
        <div key={conditionKey} className="flex items-center gap-1">
          <div
            className={`w-3 h-3 rounded-full inline-block ${
              condition.time.toLowerCase() === "day" ? "bg-yellow-400" : condition.time.toLowerCase() === "night" ? "bg-indigo-800" : "bg-pk-surface-400"
            }`}
          ></div>
          <span>{t(`time_${condition.time.toLowerCase()}`)}</span>
        </div>
      )
      break
    case "moveType":
      conditions.push(<span key={conditionKey}>{t(`evolution_moveType`, { type: condition.type })}</span>)
      break
    case "biome":
      const biomeStrs = condition.biomes as string[]
      const biomes = [] as string[]
      biomeStrs.forEach((biome) => {
        if (biome.includes("biomesoplenty") || biome.includes("terraforged")) return
        biomes.push(t(biome.replace(" ", "_").replace(":", "_")))
      })
      conditions.push(
        <span
          key={conditionKey}
          title={biomes.join(", ")}
          className="underline decoration-dotted cursor-help inline-flex items-center gap-1"
        >
          <span>En biomas específicos</span>
          <InformationCircleIcon className="h-4 w-4 text-pk-primary-300" />
        </span>
      )
      break
    case "evolutionRock":
      conditions.push(<span key={conditionKey}>{t(`evolution_rock`, { evolutionRock: t(`${condition.evolutionRock}`) })}</span>)
      break
    case "nature":
    case "evolution_nature":
      const nature = condition.natures.map((n: string) => t(`nature_${n.toLowerCase()}`)).join(", ")
      conditions.push(<span key={conditionKey}>{t(`evolution_nature`, { nature })}</span>)
      break
    case "party":
      const partyMembers = [
        ...((condition.withPokemon as string[]) || []),
        ...((condition.withTypes as string[]) || []),
        ...((condition.withForms as string[]) || []),
        ...((condition.withPalettes as string[]) || []),
      ]
      conditions.push(<span key={conditionKey}>{t(`evolution_party`, { party: partyMembers.join(", ") })}</span>)
      break
    case "heldItem":
      const [, heldItemId] = condition.item.itemID.split(":") || []
      conditions.push(
        <div key={conditionKey} className="flex items-center justify-center">
          <span className="mx-1">{t(`evolution_heldItem`, { item: t(`item_${heldItemId}`) })}</span>
          <ItemSprite name={heldItemId} width={30} height={30} />
        </div>
      )
      break
    case "critical":
      conditions.push(<span key={conditionKey}>{t(`evolution_critical`, { critical: condition.critical })}</span>)
      break
    case "statRatio":
      if (condition.ratio === 1)
        conditions.push(<span key={conditionKey}>{t(`evolution_statRatio`, { stat1: condition.stat1, stat2: condition.stat2 })}</span>)
      break
    case "move":
      const attackName = condition.attackName.toLowerCase().replace(" ", "_")
      conditions.push(<span key={conditionKey}>{t(`evolution_move`, { attackName: t(`attack_${attackName}`) })}</span>)
      break
    case "status":
      conditions.push(<span key={conditionKey}>{t(`evolution_status`, { status: t(`status_${condition.type.toLowerCase()}`) })}</span>)
      break
    case "chance":
      conditions.push(<span key={conditionKey}>{t(`evolution_chance`, { chance: condition.chance * 100 })}</span>)
      break
    case "moveUses":
      const move = condition.move.toLowerCase().replace(" ", "_") as string
      conditions.push(<span key={conditionKey}>{t(`evolution_moveuses`, { move: t(`attack_${move}`), uses: condition.uses as number })}</span>)
      break
    case "gender":
      conditions.push(<span key={conditionKey}>{t(`evolution_gender`, { genders: (condition.genders as string[])?.join(", ") })}</span>)
      break
    case "recoil":
      conditions.push(<span key={conditionKey}>{t(`evolution_recoil`, { recoil: condition.recoil })}</span>)
      break
    case "healthAbsence":
      conditions.push(<span key={conditionKey}>{t(`evolution_healthAbsence`, { health: condition.health })}</span>)
      break
    case "shiny":
      if (condition.shiny) conditions.push(<span key={conditionKey} className="text-yellow-300 font-medium">{t(`palette_shiny`)}</span>)
      break
    case "highAltitude":
      conditions.push(<span key={conditionKey}>{t(`evolution_highAltitude`, { minAltitude: condition.minAltitude })}</span>)
      break
    case "weather":
      conditions.push(<span key={conditionKey}>{t(`evolution_weather`, { weather: t(`weather_${condition.weather.toLowerCase()}`) })}</span>)
      break
    case "nuggets":
      conditions.push(<span key={conditionKey}>{t(`evolution_nuggets`, { nuggets: condition.nuggets })}</span>)
      break
    case "evolutionScroll":
      conditions.push(<span key={conditionKey}>{t(`evolution_scroll`, { scroll: t(`${condition.evolutionScroll}`) })}</span>)
      break
    case "blocksWalkedOutsideBall":
      conditions.push(<span key={conditionKey}>{t(`evolution_blocksWalkedOutsideBall`, { blocks: condition.blocksToWalk })}</span>)
      break
    case "insideBattle":
      conditions.push(<span key={conditionKey}>{t(`evolution_insideBattle`)}</span>)
      break
    default:
      conditions.push(<span key={conditionKey}>{condition.evoConditionType}</span>)
  }
}
