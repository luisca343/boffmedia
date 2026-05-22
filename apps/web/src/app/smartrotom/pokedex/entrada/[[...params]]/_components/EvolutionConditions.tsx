import React from "react"
import { Evolution } from "@/types/Pokemon"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/primitives/hover-card"
import { InformationCircleIcon } from "@heroicons/react/24/outline"
import { ItemSprite } from "../../../_components/PokemonSprite"

export function getEvolutionMethod(evolution: Evolution, t: any) {
  const conditions = [] as React.ReactNode[]

  // Process primary evolution type
  switch(evolution.evoType) {
    case "interact":
      const [modId, itemId] = evolution.item?.itemID.split(':') || []
      conditions.push(
        <div className="flex items-center justify-center" key="interact">
          <span className='mx-1'>{t(`evolution_interact`, {item: t(`item_${itemId}`)})}</span>
          <ItemSprite name={itemId} width={30} height={30}/>
        </div>
      )
      break
    case "leveling":
      if(evolution.level) conditions.push(
        <span key="leveling" className="font-medium">{t(`evolution_level`, {level: evolution.level})}</span>
      )
      else conditions.push(
        <span key="leveling" className="font-medium">{t(`evolution_leveling`)}</span>
      )
      break
    case "trade":
      conditions.push(
        <span key="trade" className="font-medium">{t(`evolution_trade`)}</span>
      )
      break
    case "ticking":
      conditions.push(
        <span key="ticking" className="font-medium">{t(`evolution_ticking`)}</span>
      )
      break
    case "emptyslot":
      conditions.push(
        <span key="emptyslot" className="font-medium">{t(`evolution_emptyslot`)}</span>
      )
      break
    default:
      conditions.push(
        <span key="default" className="font-medium">{evolution.evoType}</span>
      )
  }

  // Process additional conditions
  if(evolution.conditions?.length > 0) {
    evolution.conditions.forEach((condition, index) => {
      const conditionType = condition.evoConditionType
      const conditionKey = `${conditionType}-${index}`
      
      // Add each condition based on type
      addConditionByType(condition, conditionKey, conditions, t)
    })
  }

  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      {conditions.map((condition, i) => (
        <div key={`cond-${i}`} className="text-[11px] text-surface-200 leading-tight">{condition}</div>
      ))}
    </div>
  )
}

// Helper function to add condition based on its type
function addConditionByType(condition: any, conditionKey: string, conditions: React.ReactNode[], t: any) {
  const conditionType = condition.evoConditionType
  
  switch(conditionType) {
    case "friendship":
      conditions.push(
        <span key={conditionKey}>{t(`evolution_friendship`, {value: condition.friendship})}</span>
      )
      break
      
    case "time":
      conditions.push(
        <div key={conditionKey} className="flex items-center gap-1">
          <div className={`w-3 h-3 rounded-full inline-block ${
            condition.time.toLowerCase() === 'day' ? 'bg-yellow-400' : 
            condition.time.toLowerCase() === 'night' ? 'bg-indigo-800' : 
            'bg-surface-400'
          }`}></div>
          <span>{t(`time_${condition.time.toLowerCase()}`)}</span>
        </div>
      )
      break
      
    case "moveType":
      conditions.push(
        <span key={conditionKey}>{t(`evolution_moveType`, {type: condition.type})}</span>
      )
      break
      
    case "biome":
      const biomeStrs = condition.biomes as string[]
      const biomes = [] as string[]
      biomeStrs.forEach((biome) => {
        if(biome.includes("biomesoplenty") || biome.includes("terraforged")) return
        biomes.push(t(biome.replace(" ", "_").replace(':', '_')))
      })
      conditions.push(
        <HoverCard key={conditionKey}>
          <HoverCardTrigger className='underline hover:cursor-pointer flex items-center'>
            <span>En biomas específicos</span>
            <InformationCircleIcon className="h-4 w-4 ml-1 text-primary-300" />
          </HoverCardTrigger>
          <HoverCardContent className="w-96 bg-surface-800 text-surface-50 border border-white/[0.06] rounded-lg z-50 shadow-xl p-4 font-normal">
            {biomes.join(', ')}
          </HoverCardContent>
        </HoverCard>
      )
      break
      
    case "evolutionRock":
      conditions.push(
        <span key={conditionKey}>{t(`evolution_rock`, {evolutionRock: t(`${condition.evolutionRock}`)})}</span>
      )
      break
      
    case "nature":
    case "evolution_nature":
      const natures = condition.natures
      const nature = natures.map((nature: string) => t(`nature_${nature.toLowerCase()}`)).join(", ")
      conditions.push(
        <span key={conditionKey}>{t(`evolution_nature`, {nature})}</span>
      )
      break
      
    case "party":
      const partyMembers = [
        ...(condition.withPokemon as string[] || []),
        ...(condition.withTypes as string[] || []),
        ...(condition.withForms as string[] || []),
        ...(condition.withPalettes as string[] || [])
      ]
      conditions.push(
        <span key={conditionKey}>{t(`evolution_party`, {party: partyMembers.join(", ")})}</span>
      )
      break
      
    case "heldItem":
      const [modId, itemId] = condition.item.itemID.split(':') || []
      conditions.push(
        <div key={conditionKey} className="flex items-center justify-center">
          <span className='mx-1'>{t(`evolution_heldItem`, {item: t(`item_${itemId}`)})}</span>
          <ItemSprite name={itemId} width={30} height={30}/>
        </div>
      )
      break
      
    case "critical":
      conditions.push(
        <span key={conditionKey}>{t(`evolution_critical`, {critical: condition.critical})}</span>
      )
      break
      
    case "statRatio":
      if(condition.ratio === 1) {
        conditions.push(
          <span key={conditionKey}>{t(`evolution_statRatio`, {stat1: condition.stat1, stat2: condition.stat2})}</span>
        )
      }
      break
      
    case "move":
      const attackName = condition.attackName.toLowerCase().replace(" ", "_")
      conditions.push(
        <span key={conditionKey}>{t(`evolution_move`, {attackName: t(`attack_${attackName}`)})}</span>
      )
      break
      
    case "status":
      const status = condition.type.toLowerCase()
      conditions.push(
        <span key={conditionKey}>{t(`evolution_status`, {status: t(`status_${status}`)})}</span>
      )
      break
      
    case "chance":
      const chance = condition.chance * 100
      conditions.push(
        <span key={conditionKey}>{t(`evolution_chance`, {chance})}</span>
      )
      break
      
    case "moveUses":
      const move = condition.move.toLowerCase().replace(" ", "_") as string
      const uses = condition.uses as number
      conditions.push(
        <span key={conditionKey}>{t(`evolution_moveuses`, {move: t(`attack_${move}`), uses})}</span>
      )
      break
      
    case "gender":
      const genders = condition.genders as string[]	
      conditions.push(
        <span key={conditionKey}>{t(`evolution_gender`, {genders: genders?.join(", ")})}</span>
      )
      break
      
    case "recoil":
      conditions.push(
        <span key={conditionKey}>{t(`evolution_recoil`, {recoil: condition.recoil})}</span>
      )
      break
      
    case "healthAbsence":
      conditions.push(
        <span key={conditionKey}>{t(`evolution_healthAbsence`, {health: condition.health})}</span>
      )
      break
      
    case "shiny":
      if(condition.shiny) {
        conditions.push(
          <span key={conditionKey} className="text-yellow-300 font-medium">{t(`palette_shiny`)}</span>
        )
      }
      break
      
    case "highAltitude":
      conditions.push(
        <span key={conditionKey}>{t(`evolution_highAltitude`, {minAltitude: condition.minAltitude})}</span>
      )
      break
      
    case "weather":
      conditions.push(
        <span key={conditionKey}>{t(`evolution_weather`, {weather: t(`weather_${condition.weather.toLowerCase()}`)})}</span>
      )
      break
      
    case "nuggets":
      conditions.push(
        <span key={conditionKey}>{t(`evolution_nuggets`, {nuggets: condition.nuggets})}</span>
      )
      break
      
    case "evolutionScroll":
      conditions.push(
        <span key={conditionKey}>{t(`evolution_scroll`, {scroll: t(`${condition.evolutionScroll}`)})}</span>
      )
      break
      
    case "blocksWalkedOutsideBall":
      conditions.push(
        <span key={conditionKey}>{t(`evolution_blocksWalkedOutsideBall`, {blocks: condition.blocksToWalk})}</span>
      )
      break
      
    case "insideBattle":
      conditions.push(
        <span key={conditionKey}>{t(`evolution_insideBattle`)}</span>
      )
      break
      
    default:
      conditions.push(
        <span key={conditionKey}>{condition.evoConditionType}</span>
      )
  }
}