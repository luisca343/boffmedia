import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select";
import { Badge } from "@/components/ui/primitives/badge";
import { Filter, Activity, Gamepad2 } from "lucide-react";

interface GameFiltersProps {
  filter: string | null;
  onFilterChange: (filter: string | null) => void;
  gamesCount: number;
}

export function GameFilters({ filter, onFilterChange, gamesCount }: GameFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Status Filter */}
      <div className="relative">
        <Select 
          value={filter || 'all'} 
          onValueChange={(value) => onFilterChange(value === 'all' ? null : value)}
        >
          <SelectTrigger className="w-[200px] h-11 bg-layer-3/50 border-edge text-ink hover:bg-layer-3/50 transition-colors">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-secondary-hover" />
              <SelectValue placeholder="Filtrar por estado" />
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
            <SelectItem 
              value="active" 
              className="text-ink hover:bg-layer-3 focus:bg-layer-3"
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-success-hover" />
                Juegos activos
              </div>
            </SelectItem>
            <SelectItem 
              value="inactive" 
              className="text-ink hover:bg-layer-3 focus:bg-layer-3"
            >
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-layer-3" />
                Juegos inactivos
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
