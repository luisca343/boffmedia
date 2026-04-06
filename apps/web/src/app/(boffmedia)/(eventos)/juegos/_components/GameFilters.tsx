import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select";
import { Badge } from "@/components/ui";
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
          <SelectTrigger className="w-[200px] h-11 bg-surface-700/50 border-surface-600 text-surface-50 hover:bg-surface-600/50 transition-colors">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-accent-400" />
              <SelectValue placeholder="Filtrar por estado" />
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
            <SelectItem 
              value="active" 
              className="text-surface-50 hover:bg-surface-700 focus:bg-surface-700"
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-success-400" />
                Juegos activos
              </div>
            </SelectItem>
            <SelectItem 
              value="inactive" 
              className="text-surface-50 hover:bg-surface-700 focus:bg-surface-700"
            >
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-surface-500" />
                Juegos inactivos
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
