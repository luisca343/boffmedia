import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PokedexTable({children}: {children: React.ReactNode}){
    return <Table  className="text-center  border-collapse bg-surface-600 border border-surface-950 my-4 font-bold text-xl 2xl:text-base text-surface-100">
        {children}
    </Table>
}

export function PokedexRow({children}: {children: React.ReactNode}){
    return <TableRow className="hover:bg-surface-500 border border-surface-950"  >
        {children}
    </TableRow>
}

export function PokedexHeader({children}: {children: React.ReactNode}){
    return <TableHeader className=" bg-surface-900 hover:bg-surface-900 border border-surface-950">
        {children}
    </TableHeader>
}

export function PokedexCell({children='', className= '', colSpan= 1}: {children: React.ReactNode, className?: string, colSpan?: number}){
    return <TableCell className={`2xl:border border-2 border-surface-950 p-1 ${className} `} colSpan={colSpan}>
        {children}
    </TableCell>
}

export function PokedexHead({children, className, colSpan= 1}: {children: React.ReactNode, className?: string, colSpan?: number}){
    return <PokedexCell className={`bg-surface-900 text-surface-50 ${className}`} colSpan={colSpan}>
        {children}
    </PokedexCell>
}