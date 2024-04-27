import { Table, TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { LevelUpMove, Moves, Pokemon } from "@/types/Pokemon";
import PokedexTable, { PokedexCell, PokedexHead, PokedexHeader, PokedexRow } from "../../../_components/PokedexTable";

import useTranslation from 'next-translate/useTranslation'
import TypeBadge from "./TypeBadge";

export function MovesTable({moves, sort = false, moveData}: {moves: Moves, sort?: boolean, moveData?: any}){
    const { t } = useTranslation("smartrotom/pokedex/moves")
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
    

    return <PokedexTable>
            <PokedexHeader>
                <TableRow>
                    <PokedexCell> </PokedexCell>
                    <PokedexCell>Nombre</PokedexCell>
                    <PokedexCell>Tipo</PokedexCell>
                    <PokedexCell>Categoría</PokedexCell>
                    <PokedexCell>Potencia</PokedexCell>
                    <PokedexCell>Precisión</PokedexCell>
                    <PokedexCell>PP</PokedexCell>
                    <PokedexCell>Método</PokedexCell>
                </TableRow>
            </PokedexHeader>
            <TableBody >
                {Object.entries(sortedMoves).map(([key, value], index) => {
                    let extraMoveData
                    try{
                        extraMoveData = moveData[key]
                    } catch(e) {
                        console.log(`Error loading move data for ${key}`)
                    }
                    if (extraMoveData) {
                        return <PokedexRow key={key}>
                            <PokedexHead className="w-12">{index + 1}</PokedexHead>
                            <PokedexCell>{t(`attack_${key.toLowerCase().replace(" ", "_")}`)}</PokedexCell>
                            <PokedexCell className="w-28"><TypeBadge type={extraMoveData.type.toLowerCase()}/></PokedexCell>
                            <PokedexCell className="w-28"><TypeBadge type={extraMoveData.category.toLowerCase()}/></PokedexCell>
                            <PokedexCell>{extraMoveData.power !== 0 && extraMoveData.power}</PokedexCell>
                            <PokedexCell>{extraMoveData.accuracy !== -1 && extraMoveData.accuracy}</PokedexCell>
                            <PokedexCell>{extraMoveData.pp}</PokedexCell>
                            <PokedexCell>{value.join(', ')}</PokedexCell>
                        </PokedexRow>
                    }
                })}
                
            </TableBody>
        </PokedexTable>
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
            movesList[key] = moves[key]
        }
    })
    
    return <MovesTable moves={movesList} sort={true} moveData={moveData}/>

    
}
