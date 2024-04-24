
import PokedexTable, { PokedexCell, PokedexHeader, PokedexRow } from "./PokedexTable"
import TypeBadge from "./TypeBadge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function TypeTable({list, title, id, className=''}: {list: {[key: string]: number}, title?: string, id?: string, className?: string}){
    const effectivities = [4, 2, 1, 0.5, 0.25, 0]

    return(
        <div className={`flex m-2 ${className}`} id={id}>
            <PokedexTable >
                <PokedexHeader>
                    <TableRow className="hover:bg-inherit border-none ">
                                <PokedexCell> </PokedexCell>
                                <PokedexCell  className="text-center bold text-white font-bold ">{title}</PokedexCell>
                    </TableRow>
                </PokedexHeader>
                <TableBody>
                    {effectivities.map(effectivity => {
                        if(!Object.values(list).includes(effectivity)) return null
                        return (
                        <PokedexRow key={effectivity} >
                            <PokedexCell className="font-bold text-white w-24 bg-zinc-900 ">x{effectivity}</PokedexCell>
                            <PokedexCell>
                            <div className="flex flex-row flex-wrap w-full " >
                                {Object.entries(list)
                                .map((entry) => {
                                    const [type, value] = entry
                                    if(value == effectivity) return <TypeBadge type={type} />
                                    return null
                                })}
                            </div>
                            </PokedexCell>
                        </PokedexRow>
                    )
                })}
            </TableBody>
            </PokedexTable>
        </div>
    )
}