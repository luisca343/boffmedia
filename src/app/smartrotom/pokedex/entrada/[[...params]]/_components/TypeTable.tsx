
import PokedexTable, { PokedexCell, PokedexHead, PokedexHeader, PokedexRow } from "../../../_components/PokedexTable"
import TypeBadge from "./TypeBadge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function TypeTable({list, title, id, className=''}: {list: {[key: string]: number}, title?: string, id?: string, className?: string}){
    const effectivities = [4, 2, 1, 0.5, 0.25, 0]

    return(
        <div className={`flex m-2 ${className}`} id={id}>
            <PokedexTable >
                <PokedexHeader>
                    <TableRow className="hover:bg-inherit border-none ">
                                <PokedexHead> </PokedexHead>
                                <PokedexHead  className="text-center bold text-text-primary font-bold ">{title}</PokedexHead>
                    </TableRow>
                </PokedexHeader>
                <TableBody>
                    {effectivities.map(effectivity => {
                        if(!Object.values(list).includes(effectivity)) return null
                        return (
                        <PokedexRow key={effectivity} >
                            <PokedexHead className="font-bold text-text-primary w-24  ">x{effectivity}</PokedexHead>
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