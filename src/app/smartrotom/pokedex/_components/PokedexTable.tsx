import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PokedexTable({children}: {children: React.ReactNode}){
    return <Table  className="text-center  border-collapse bg-surface-5 border border-border-dark my-4 font-bold text-xl 2xl:text-base text-text-primary">
        {children}
    </Table>
}

export function PokedexRow({children}: {children: React.ReactNode}){
    return <TableRow className="hover:bg-secondary-hover border border-border-dark"  >
        {children}
    </TableRow>
}

export function PokedexHeader({children}: {children: React.ReactNode}){
    return <TableHeader className=" bg-surface-2 hover:bg-surface-2 border border-border-dark">
        {children}
    </TableHeader>
}

export function PokedexCell({children='', className= '', colSpan= 1}: {children: React.ReactNode, className?: string, colSpan?: number}){
    return <TableCell className={`2xl:border border-2 border-border-dark p-1 ${className} `} colSpan={colSpan}>
        {children}
    </TableCell>
}

export function PokedexHead({children, className, colSpan= 1}: {children: React.ReactNode, className?: string, colSpan?: number}){
    return <PokedexCell className={`bg-surface-2 text-text-primary ${className}`} colSpan={colSpan}>
        {children}
    </PokedexCell>
}