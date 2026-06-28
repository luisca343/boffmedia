import PokedexTable, { PokedexCell, PokedexHead, PokedexHeader, PokedexRow } from "../../../_components/PokedexTable"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/primitives/table"
import TypeBadge from "@/components/shared/pokemon/TypeBadge"

export function TypeTable({list, title, id, className='', badgeType}: 
    {list: {[key: string]: number}, title?: string, id?: string, className?: string, badgeType?: "offensive" | "defensive"}){
    
    // Only show multipliers that actually have types
    const effectivities = [4, 2, 1, 0.5, 0.25, 0]
    const visibleEffectivities = effectivities.filter(eff => Object.values(list).includes(eff))
    
    // Visual styles based on whether this is offensive or defensive
    const headerStyle = badgeType === "offensive" ? 
      "bg-red-900/20 border-red-800/30" : 
      "bg-secondary-soft/20 border-secondary-active/30"
    
    return (
        <div className={`m-2 ${className}`} id={id}>
          <PokedexTable>
            <PokedexHeader>
              <PokedexRow>
                <PokedexHead colSpan={2} className="text-center text-lg">{title}</PokedexHead>
              </PokedexRow>
            </PokedexHeader>
            <TableBody>
              {visibleEffectivities.map(effectivity => (
                <PokedexRow key={effectivity}>
                  <PokedexCell 
                    hard 
                    className={`font-bold text-ink w-24 text-center`}
                  >
                    {effectivity > 0 ? `×${effectivity}` : "×0"}
                  </PokedexCell>
                  <PokedexCell>
                    <div className="flex flex-row flex-wrap gap-1">
                      {Object.entries(list)
                        .filter(([_, value]) => value === effectivity)
                        .map(([type, _]) => (
                          <TypeBadge key={type} type={type} />
                        ))}
                    </div>
                  </PokedexCell>
                </PokedexRow>
              ))}
              {visibleEffectivities.length === 0 && (
                <PokedexRow>
                  <PokedexCell colSpan={2} className="text-center py-4 text-ink">
                    No hay efectividades para mostrar
                  </PokedexCell>
                </PokedexRow>
              )}
            </TableBody>
          </PokedexTable>
        </div>
      )
}