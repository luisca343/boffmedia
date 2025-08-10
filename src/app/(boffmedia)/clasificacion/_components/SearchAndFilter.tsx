import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type SearchAndFilterProps = {
  searchTerm: string
  setSearchTerm: (term: string) => void
  sortBy: string
  setSortBy: (sort: string) => void
}

export function SearchAndFilter({ searchTerm, setSearchTerm, sortBy, setSortBy }: SearchAndFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
      <div className="relative w-full md:w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-surface-400" />
        <Input
          placeholder="Buscar jugador..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-surface-700 border-surface-600 text-surface-50"
        />
      </div>

      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className="w-full sm:w-40 bg-surface-700 border-surface-600 text-surface-50">
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Ordenar por" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-surface-800 border-surface-700">
          <SelectItem value="score-desc">Mayor puntuación</SelectItem>
          <SelectItem value="score-asc">Menor puntuación</SelectItem>
          <SelectItem value="medals-desc">Más medallas</SelectItem>
          <SelectItem value="achievements-desc">Más logros</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

