
import TypeBadge from "./TypeBadge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function TypeTable({list, title, id, className}: {list: {[key: string]: number}, title?: string, id?: string, className?: string}){
    const effectivities = [4, 2, 1, 0.5, 0.25, 0]
    return(
        <div className={`flex m-2 ${className}`} id={id}>
            <Table className="w-full ">
            <TableRow className="hover:bg-inherit">
                    <TableHeader>
                        <TableCell className="text-center bold text-2xl text-white">{title}</TableCell>
                    </TableHeader>
            </TableRow>
                {effectivities.map(effectivity => {
                    if(!Object.values(list).includes(effectivity)) return null
                    return (
                    <TableRow key={effectivity} className="flex items-center border-none hover:bg-zinc-700">
                        <TableCell className="text-xl text-white w-24">x{effectivity}</TableCell>
                        <TableCell className="flex flex-row flex-wrap w-full" >
                        {Object.entries(list)
                            .map((entry) => {
                                const [type, value] = entry
                                if(value == effectivity) return <TypeBadge type={type} />
                                return null
                            })}
                        </TableCell>
                    </TableRow>
                )
            })}
            </Table>
        </div>
    )
}