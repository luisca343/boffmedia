import { useGetGames } from "@/hooks/events/useGetGames";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Game } from "@/types/events";

interface EventFiltersProps {
  filter: string | null;
  onFilterChange: (filter: string | null) => void;
  eventsCount: number;
}

export function EventFilters({ filter, onFilterChange, eventsCount }: EventFiltersProps) {
  const { games, isLoading } = useGetGames();
  
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <Select 
          value={filter || 'all'} 
          onValueChange={(value) => onFilterChange(value === 'all' ? null : value)}
        >
          <SelectTrigger className="bg-surface-700 border-surface-600 text-surface-50 w-full md:w-[180px]">
            <SelectValue placeholder="Todos los juegos" />
          </SelectTrigger>
          <SelectContent className="bg-surface-800 border-surface-700">
            <SelectItem value="all">Todos los juegos</SelectItem>
            {!isLoading && games?.map((game: Game) => (
              <SelectItem key={game.id} value={game.id.toString()}>
                {game.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="hidden md:flex items-center">
        <span className="text-surface-300 text-sm mr-2">Eventos:</span>
        <Badge className="bg-primary-500/20 text-primary-400 border border-primary-500/30">
          {eventsCount}
        </Badge>
      </div>
    </div>
  );
}