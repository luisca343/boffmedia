import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'

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
    <div className="bg-surface-700/50 border border-surface-600/50 rounded-xl p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder={t('filter.searchPlaceholder')}
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="w-full pl-10 bg-surface-800/50 border-surface-600/50 text-surface-50 hover:bg-surface-800 focus:border-primary-400 transition-colors"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-400 w-4 h-4" />
        </div>
        <div className="relative sm:w-[200px]">
          <Select value={expansionFilter} onValueChange={setExpansionFilter}>
            <SelectTrigger className="w-full bg-surface-800/50 border-surface-600/50 text-surface-50 hover:bg-surface-800 focus:border-primary-400 transition-colors">
              <div className="flex items-center">
                <FunnelIcon className="w-4 h-4 mr-2 text-surface-400" />
                <SelectValue placeholder={t('filter.expansionPlaceholder')} />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-surface-700 border-surface-600">
              <SelectItem value="all">{t('filter.allExpansions')}</SelectItem>
              {expansions.map((expansion) => (
                <SelectItem key={expansion} value={expansion}>
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