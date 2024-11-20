"use client"
import { Table, TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { LevelUpMove, Moves, Pokemon } from "@/types/Pokemon";
import PokedexTable, { PokedexCell, PokedexHead, PokedexHeader, PokedexRow } from "../../../_components/PokedexTable";

import TypeBadge from "./TypeBadge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import MoveDataElement from "../../../movimientos/_components/MoveData";
import { useTranslations } from "next-intl";

export function MovesTable({moves, sort = false, moveData}: {moves: Moves, sort?: boolean, moveData?: any}){
    const t  = useTranslations("");
    let sortedMoves = {} as {[key: string]: any[]}
    Object.entries(moves).forEach(([key, value]: [string, any]) => {
        if(key === 'levelUpMoves') {
            value.forEach((move: LevelUpMove) => {
                move.attacks.forEach((moveName: any) => {
                    //const moveId = t(`attack_${moveName.replace(/ /g, '_').toLowerCase()}`)
                    const moveId = moveName
                    if(!sortedMoves[moveId]) sortedMoves[moveId] = []
                    let currentMoves = sortedMoves[moveId]

                    sortedMoves[moveId] = [...currentMoves, `Nivel ${move.level}`]
                })
            })
        } else {
            value.forEach((move: any) => {
                //const moveId = t(`attack_${move.replace(/ /g, '_').toLowerCase()}`)
                const moveId = move
                const moveIdTranslated = t(`attack_${move.replace(/ /g, '_').toLowerCase()}`)
                if(!sortedMoves[moveId]) sortedMoves[moveId] = []
                sortedMoves[moveId] = [...sortedMoves[moveId], t(key)]
            })
        }

    })

    // Sort moves alphabetically by its translated name
    if(sort) {
        const sortedMovesKeys = Object.keys(sortedMoves).sort((a, b) => {
            const aName = t(`attack_${a.replace(/ /g, '_').toLowerCase()}`)
            const bName = t(`attack_${b.replace(/ /g, '_').toLowerCase()}`)
            return aName.localeCompare(bName)
        })
        const sortedMovesCopy = {} as {[key: string]: any[]}
        sortedMovesKeys.forEach((key) => {
            sortedMovesCopy[key] = sortedMoves[key]
        })
        sortedMoves = sortedMovesCopy
    }
    
    return (
        <PokedexTable>
          <PokedexHeader>
            <PokedexRow>
              <PokedexHead className="w-12 text-center">#</PokedexHead>
              <PokedexHead className="text-center">Nombre</PokedexHead>
              <PokedexHead className="text-center">Tipo</PokedexHead>
              <PokedexHead className="text-center">Categoría</PokedexHead>
              <PokedexHead className="text-center">Potencia</PokedexHead>
              <PokedexHead className="text-center">Precisión</PokedexHead>
              <PokedexHead className="text-center">PP</PokedexHead>
              <PokedexHead className="text-center">Método</PokedexHead>
            </PokedexRow>
          </PokedexHeader>
          <TableBody>
            {Object.entries(sortedMoves).map(([key, value], index) => {
              let extraMoveData
              try {
                extraMoveData = moveData[key]
              } catch (e) {
                console.log(`Error loading move data for ${key}`)
              }
              if (extraMoveData) {
                return (
                  <PokedexRow key={key}>
                    <PokedexCell hard className="text-center font-medium">{index + 1}</PokedexCell>
                    <PokedexCell className="text-center">
                      <HoverCard>
                        <HoverCardTrigger
                          onClick={() => window.location.href = `/smartrotom/pokedex/movimientos/${key}`}
                          className="hover:cursor-pointer hover:text-primary-400 transition-colors"
                        >
                          {t(`attack_${key.toLowerCase().replace(" ", "_")}`)}
                        </HoverCardTrigger>
                        <HoverCardContent className="bg-surface-700 text-surface-50 w-[400px] border-surface-950 border font-normal">
                          <MoveDataElement id={key} />
                        </HoverCardContent>
                      </HoverCard>
                    </PokedexCell>
                    <PokedexCell className="text-center w-28"><TypeBadge type={extraMoveData.type.toLowerCase()} /></PokedexCell>
                    <PokedexCell className="text-center w-28"><TypeBadge type={extraMoveData.category.toLowerCase()} /></PokedexCell>
                    <PokedexCell className="text-center">{extraMoveData.power !== 0 ? extraMoveData.power : '-'}</PokedexCell>
                    <PokedexCell className="text-center">{extraMoveData.accuracy !== -1 ? extraMoveData.accuracy : '-'}</PokedexCell>
                    <PokedexCell className="text-center">{extraMoveData.pp}</PokedexCell>
                    <PokedexCell className="text-center">{value.reverse().join(', ')}</PokedexCell>
                  </PokedexRow>
                )
              }
            })}
          </TableBody>
        </PokedexTable>
      )
}

export function LevelMovesTable({pokemon, formIndex, moveData}: {pokemon: Pokemon, formIndex: number, moveData: any}) {
    const moves = pokemon.forms[formIndex].moves ? pokemon.forms[formIndex].moves as Moves : pokemon.forms[0].moves as Moves
    if(!moves) return <h1>Moves not found</h1>

    const levelUpMoves = moves.levelUpMoves
    if(!levelUpMoves) return <h1>Level up moves not found</h1>
    return <MovesTable moves={{levelUpMoves}} moveData={moveData}/>

}

export function OtherMovesTable({pokemon, formIndex, moveData}: {pokemon: Pokemon, formIndex: number, moveData: any}) {
    const moves = pokemon.forms[formIndex].moves ? pokemon.forms[formIndex].moves as Moves : pokemon.forms[0].moves as Moves
    if(!moves) return <h1>Moves not found</h1>

    let movesList: Moves = {}

    Object.keys(moves).forEach((key) => {
        if(key !== 'levelUpMoves') {
            // @ts-ignore
            movesList[key] = moves[key] 
        }
    })
    
    return <MovesTable moves={movesList} sort={true} moveData={moveData}/>

    
}
