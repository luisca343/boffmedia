
import PokedexTable, { PokedexCell, PokedexHead, PokedexHeader, PokedexRow } from "../../../_components/PokedexTable"
import TypeBadge from "./TypeBadge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function TypeTable({list, title, id, className=''}: {list: {[key: string]: number}, title?: string, id?: string, className?: string}){
    const effectivities = [4, 2, 1, 0.5, 0.25, 0]

    return (
        <div className={`m-2 ${className}`} id={id}>
          <PokedexTable>
            <PokedexHeader>
              <PokedexRow>
                <PokedexHead colSpan={2} className="text-center text-lg">{title}</PokedexHead>
              </PokedexRow>
            </PokedexHeader>
            <TableBody>
              {effectivities.map(effectivity => {
                if (!Object.values(list).includes(effectivity)) return null
                return (
                  <PokedexRow key={effectivity}>
                    <PokedexCell hard className="font-bold text-surface-50 w-24 text-center">x{effectivity}</PokedexCell>
                    <PokedexCell>
                      <div className="flex flex-row flex-wrap gap-1">
                        {Object.entries(list)
                          .map(([type, value]) => {
                            if (value == effectivity) return <TypeBadge key={type} type={type} />
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