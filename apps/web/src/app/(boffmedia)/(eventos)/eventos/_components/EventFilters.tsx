import { useGetGames } from "@/hooks/events/useGetGames";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select";
import { Badge } from "@/components/ui";
import { Filter, Gamepad2 } from "lucide-react";
import type { Game } from "@boffmedia/shared";

interface EventFiltersProps {
  filter: string | null;
  onFilterChange: (filter: string | null) => void;
  eventsCount: number;
}

export function EventFilters({ filter, onFilterChange, eventsCount }: EventFiltersProps) {
  const { games, isLoading } = useGetGames();
  
  return (
    <div className="flex items-center gap-4">
      {/* Game Filter */}
      <div className="relative">
        <Select 
          value={filter || 'all'} 
          onValueChange={(value) => onFilterChange(value === 'all' ? null : value)}
        >
          <SelectTrigger className="w-[200px] h-11 bg-surface-700/50 border-surface-600 text-surface-50 hover:bg-surface-600/50 transition-colors">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-accent-400" />
              <SelectValue placeholder="Filtrar por juego" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-surface-800 border-surface-700 backdrop-blur-sm">
            <SelectItem 
              value="all" 
              className="text-surface-50 hover:bg-surface-700 focus:bg-surface-700"
            >
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-accent-400" />
                Todos los juegos
              </div>
            </SelectItem>
            {!isLoading && games?.map((game: any) => (
              <SelectItem 
                key={game.id} 
                value={game.id.toString()}
                className="text-surface-50 hover:bg-surface-700 focus:bg-surface-700"
              >
                <div className="flex items-center gap-2">
                  {game.icon ? (
                    <img src={game.icon} alt="" className="w-4 h-4 rounded" />
                  ) : (
                    <div className="w-4 h-4 bg-surface-600 rounded"></div>
                  )}
                  {game.title}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}