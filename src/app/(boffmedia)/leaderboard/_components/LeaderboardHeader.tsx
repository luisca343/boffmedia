import { Trophy, Search, Filter } from "lucide-react"
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type LeaderboardHeaderProps = {
  playerCount: number
  searchTerm: string
  setSearchTerm: (term: string) => void
  sortBy: "score" | "medals" | "achievements"
  sortDirection: "asc" | "desc"
  setSortBy: (sortBy: "score" | "medals" | "achievements") => void
  setSortDirection: (direction: "asc" | "desc") => void
}

export function LeaderboardHeader({
  playerCount,
  searchTerm,
  setSearchTerm,
  sortBy,
  sortDirection,
  setSortBy,
  setSortDirection,
}: LeaderboardHeaderProps) {
  return (
    <CardHeader>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-6 w-6 text-primary-500" />
            <span className="text-lg font-semibold text-primary-500">Ranking Global</span>
          </div>
          <CardTitle className="text-2xl text-surface-50">Tabla de Clasificación</CardTitle>
          <CardDescription className="text-surface-300">{playerCount} jugadores en la clasificación</CardDescription>
        </div>

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

          <Select
            value={`${sortBy}-${sortDirection}`}
            onValueChange={(val) => {
              const [newSortBy, newSortDir] = val.split("-") as ["score" | "medals" | "achievements", "asc" | "desc"]
              setSortBy(newSortBy)
              setSortDirection(newSortDir)
            }}
          >
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
              <SelectItem value="medals-asc">Menos medallas</SelectItem>
              <SelectItem value="achievements-desc">Más logros</SelectItem>
              <SelectItem value="achievements-asc">Menos logros</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardHeader>
  )
}

