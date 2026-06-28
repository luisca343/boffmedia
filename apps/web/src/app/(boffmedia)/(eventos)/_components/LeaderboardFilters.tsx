import { Input } from "@/components/ui/primitives/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select";
import { Search, Filter, Trophy } from "lucide-react";

interface LeaderboardFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: "score" | "medals" | "achievements";
  sortDirection: "asc" | "desc";
  setSortBy: (sortBy: "score" | "medals" | "achievements") => void;
  setSortDirection: (direction: "asc" | "desc") => void;
  playerCount: number;
}

export function LeaderboardFilters({
  searchTerm,
  setSearchTerm,
  sortBy,
  sortDirection,
  setSortBy,
  setSortDirection,
  playerCount,
}: LeaderboardFiltersProps) {
  return (
    <div className="bg-gradient-to-r from-layer-2/80 via-secondary-soft/40 to-layer-2/80 backdrop-blur-sm border border-secondary/20 rounded-3xl p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-secondary to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary-hover to-indigo-400">
              Ranking Global
            </h2>
            <p className="text-ink-muted">{playerCount} jugadores en la clasificación</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <Input
              placeholder="Buscar jugador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-layer-2/60 border-secondary/30 text-ink placeholder:text-ink-muted focus:border-secondary/50 focus:ring-secondary/20"
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
            <SelectTrigger className="w-full sm:w-48 bg-layer-2/60 border-secondary/30 text-ink focus:border-secondary/50 focus:ring-secondary/20">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ordenar por" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-layer-2 border-secondary/30">
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
    </div>
  );
}
