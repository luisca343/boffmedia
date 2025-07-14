"use client"
import { Table, TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { LevelUpMove, Moves, Pokemon } from "@/types/Pokemon";
import PokedexTable, { PokedexCell, PokedexHead, PokedexHeader, PokedexRow } from "../../../_components/PokedexTable";

import TypeBadge from "./TypeBadge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import MoveDataElement from "../../../movimientos/_components/MoveData";
import { useTranslations } from "next-intl";
import { BoltIcon } from "@heroicons/react/24/outline";
import { InternalLink } from "@/components/nav/Link";

export function MovesTable({moves, sort = false, moveData, title}: {moves: Moves, sort?: boolean, moveData?: any, title?: string}){
    const t = useTranslations("pokedex");
    let sortedMoves = {} as {[key: string]: any[]}
    Object.entries(moves).forEach(([key, value]: [string, any]) => {
        if(key === 'levelUpMoves') {
            value.forEach((move: LevelUpMove) => {
                move.attacks.forEach((moveName: any) => {
                    const moveId = moveName
                    if(!sortedMoves[moveId]) sortedMoves[moveId] = []
                    let currentMoves = sortedMoves[moveId]

                    sortedMoves[moveId] = [...currentMoves, `Nivel ${move.level}`]
                })
            })
        } else {
            value.forEach((move: any) => {
                const moveId = move
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

    const moveEntries = Object.entries(sortedMoves).filter(([key, _]) => moveData?.[key])

    const hasData = moveEntries.length > 0
    
    return (
        <div>
            {title && <h3 className="text-lg font-medium text-primary-300 mb-3">{title}</h3>}
            
            <div className="overflow-x-auto">
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
                    {hasData ? moveEntries.map(([key, value], index) => {
                      const extraMoveData = moveData[key]
                      return (
                        <PokedexRow key={key}>
                          <PokedexCell hard className="text-center font-medium">{index + 1}</PokedexCell>
                          <PokedexCell className="text-center">
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <InternalLink
                                  href={`/pokedex/movimientos/${key}`}
                                  className="hover:text-primary-400 transition-colors inline-flex items-center"
                                >
                                  <span>{t(`attack_${key.toLowerCase().replace(" ", "_")}`)}</span>
                                </InternalLink>
                              </HoverCardTrigger>
                              <HoverCardContent className="bg-surface-700 text-surface-50 w-[400px] border-surface-950 border font-normal z-50">
                                <MoveDataElement id={key} />
                              </HoverCardContent>
                            </HoverCard>
                          </PokedexCell>
                          <PokedexCell className="text-center w-28">
                            <TypeBadge type={extraMoveData.type.toLowerCase()} />
                          </PokedexCell>
                          <PokedexCell className="text-center w-28">
                            <TypeBadge type={extraMoveData.category.toLowerCase()} />
                          </PokedexCell>
                          <PokedexCell className={`text-center ${extraMoveData.power > 80 ? 'text-red-300 font-medium' : ''}`}>
                            {extraMoveData.power !== 0 ? extraMoveData.power : '-'}
                          </PokedexCell>
                          <PokedexCell className="text-center">
                            {extraMoveData.accuracy !== -1 ? extraMoveData.accuracy : '-'}
                          </PokedexCell>
                          <PokedexCell className="text-center">{extraMoveData.pp}</PokedexCell>
                          <PokedexCell className="text-center">
                            {value.reverse().join(', ')}
                          </PokedexCell>
                        </PokedexRow>
                      )
                    }) : (
                      <PokedexRow>
                        <PokedexCell colSpan={8} className="text-center py-6 text-surface-300">
                          No se encontraron movimientos
                        </PokedexCell>
                      </PokedexRow>
                    )}
                  </TableBody>
                </PokedexTable>
            </div>
        </div>
    )
}

export function LevelMovesTable({pokemon, formIndex, moveData}: {pokemon: Pokemon, formIndex: number, moveData: any}) {
    const moves = pokemon.forms[formIndex].moves ? pokemon.forms[formIndex].moves as Moves : pokemon.forms[0].moves as Moves
    if(!moves) return <div className="text-surface-300 text-center py-4">Movimientos no encontrados</div>
    
    const levelUpMoves = moves.levelUpMoves
    if(!levelUpMoves || levelUpMoves.length === 0) return <div className="text-surface-300 text-center py-4">No hay movimientos por nivel</div>
    
    return <MovesTable moves={{levelUpMoves}} moveData={moveData} title="Movimientos por Nivel"/>
}

export function OtherMovesTable({pokemon, formIndex, moveData}: {pokemon: Pokemon, formIndex: number, moveData: any}) {
    const moves = pokemon.forms[formIndex].moves ? pokemon.forms[formIndex].moves as Moves : pokemon.forms[0].moves as Moves
    if(!moves) return <div className="text-surface-300 text-center py-4">Movimientos no encontrados</div>

    let movesList: Moves = {}
    let hasOtherMoves = false

    Object.keys(moves).forEach((key) => {
        if(key !== 'levelUpMoves') {
            // @ts-ignore
            if (moves[key].length > 0) {
                hasOtherMoves = true
                // @ts-ignore
                movesList[key] = moves[key]
            }
        }
    })
    
    if (!hasOtherMoves) return <div className="text-surface-300 text-center py-4">No hay otros movimientos disponibles</div>
    
    return <MovesTable moves={movesList} sort={true} moveData={moveData} title="Otros Movimientos"/>
}