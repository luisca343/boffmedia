import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/primitives/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select"
import { HiMagnifyingGlass, HiFunnel } from 'react-icons/hi2'

interface FilterComponentProps {
  expansions: string[]
  onFilterChange: (name: string, expansion: string) => void
  t: any
}

export function FilterComponent({ expansions, onFilterChange, t }: FilterComponentProps) {
  const [nameFilter, setNameFilter] = useState("")
  const [expansionFilter, setExpansionFilter] = useState("")

  useEffect(() => {
    onFilterChange(nameFilter, expansionFilter === "all" ? "" : expansionFilter)
  }, [nameFilter, expansionFilter, onFilterChange])

  return (
    <div className="bg-layer-3/50 border border-edge/50 rounded-xl p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder={t('filter.searchPlaceholder')}
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="w-full pl-10 bg-layer-2/50 border-edge/50 text-ink hover:bg-layer-2 focus:border-primary transition-colors"
          />
          <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-muted w-4 h-4" />
        </div>
        <div className="relative sm:w-[200px]">
          <Select value={expansionFilter} onValueChange={setExpansionFilter}>
            <SelectTrigger className="w-full bg-layer-2/50 border-edge/50 text-ink hover:bg-layer-2 focus:border-primary transition-colors">
              <div className="flex items-center">
                <HiFunnel className="w-4 h-4 mr-2 text-ink-muted" />
                <SelectValue placeholder={t('filter.expansionPlaceholder')} />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-layer-3/95 border-edge/50 backdrop-blur-sm">
              <SelectItem value="all" className="text-ink hover:bg-layer-3/50">
                {t('filter.allExpansions')}
              </SelectItem>
              {expansions.map((expansion) => (
                <SelectItem 
                  key={expansion} 
                  value={expansion}
                  className="text-ink hover:bg-layer-3/50"
                >
                  {expansion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}