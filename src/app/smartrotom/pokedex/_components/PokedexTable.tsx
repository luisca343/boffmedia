import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PokedexTable({children}: {children: React.ReactNode}){
    return <Table  className="text-center  border-collapse bg-slate-600 border border-slate-950 my-4 font-bold text-xl 2xl:text-base">
        {children}
    </Table>
}

export function PokedexRow({children}: {children: React.ReactNode}){
    return <TableRow className="hover:bg-slate-500 border border-slate-950"  >
        {children}
    </TableRow>
}

export function PokedexHeader({children}: {children: React.ReactNode}){
    return <TableHeader className=" bg-slate-900 hover:bg-slate-900 border border-slate-950">
        {children}
    </TableHeader>
}

export function PokedexCell({children='', className= '', colSpan= 1}: {children: React.ReactNode, className?: string, colSpan?: number}){
    return <TableCell className={`2xl:border border-2 border-slate-950 p-1 ${className} `} colSpan={colSpan}>
        {children}
    </TableCell>
}

export function PokedexHead({children, className}: {children: React.ReactNode, className?: string}){
    return <PokedexCell className={`bg-slate-900 ${className}`} >
        {children}
    </PokedexCell>
}