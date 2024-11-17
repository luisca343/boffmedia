import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from 'lucide-react'

interface FilterComponentProps {
  expansions: string[]
  onFilterChange: (name: string, expansion: string) => void
  trans: (key: string) => string
}

export function FilterComponent({ expansions, onFilterChange, trans }: FilterComponentProps) {
  const [nameFilter, setNameFilter] = useState("")
  const [expansionFilter, setExpansionFilter] = useState("")

  useEffect(() => {
    onFilterChange(nameFilter, expansionFilter === "all" ? "" : expansionFilter)
  }, [nameFilter, expansionFilter, onFilterChange])

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-grow">
        <Input
          type="text"
          placeholder="Buscar cartas por nombre"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface-700 text-white border-surface-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-400" size={20} />
      </div>
      <Select value={expansionFilter} onValueChange={setExpansionFilter}>
        <SelectTrigger className="w-full sm:w-[200px] bg-surface-700 text-white border-surface-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500">
          <SelectValue placeholder="Filtrar por expansión" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las expansiones</SelectItem>
          {expansions.map((expansion) => (
            <SelectItem key={expansion} value={expansion}>
              {trans(expansion)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}