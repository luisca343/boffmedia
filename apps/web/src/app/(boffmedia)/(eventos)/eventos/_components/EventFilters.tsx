import { useGetGames } from "@/hooks/events/useGetGames";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select";
import { Badge } from "@/components/ui/primitives/badge";
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
          <SelectTrigger className="w-[200px] h-11 bg-layer-3/50 border-edge text-ink hover:bg-layer-3/50 transition-colors">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-secondary-hover" />
              <SelectValue placeholder="Filtrar por juego" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-layer-2 border-edge backdrop-blur-sm">
            <SelectItem 
              value="all" 
              className="text-ink hover:bg-layer-3 focus:bg-layer-3"
            >
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-secondary-hover" />
                Todos los juegos
              </div>
            </SelectItem>
            {!isLoading && games?.map((game: any) => (
              <SelectItem 
                key={game.id} 
                value={game.id.toString()}
                className="text-ink hover:bg-layer-3 focus:bg-layer-3"
              >
                <div className="flex items-center gap-2">
                  {game.icon ? (
                    <img src={game.icon} alt="" className="w-4 h-4 rounded" />
                  ) : (
                    <div className="w-4 h-4 bg-layer-3 rounded"></div>
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