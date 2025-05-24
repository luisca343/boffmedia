import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, Grid, List } from "lucide-react";
import { EventFilters } from "./EventFilters";

interface EventsHeaderProps {
  totalEvents: number;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  filter: string | null;
  onFilterChange: (filter: string | null) => void;
}

export function EventsHeader({
  totalEvents,
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filter,
  onFilterChange,
}: EventsHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-surface-50 flex items-center">
            <Calendar className="mr-2 h-8 w-8 text-primary-500" />
            Eventos y Competiciones
          </h1>
          <p className="text-surface-300 mt-1">
            Descubre y participa en los próximos eventos de la comunidad
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant={viewMode === 'grid' ? "default" : "outline"}
            size="icon" 
            onClick={() => onViewModeChange('grid')}
            className={viewMode === 'grid' ? "bg-primary-500" : "border-surface-600"}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? "default" : "outline"} 
            size="icon" 
            onClick={() => onViewModeChange('list')}
            className={viewMode === 'list' ? "bg-primary-500" : "border-surface-600"}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-surface-400" />
          <Input
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-surface-700 border-surface-600 text-surface-50"
          />
        </div>
        
        <EventFilters
          filter={filter}
          onFilterChange={onFilterChange}
          eventsCount={totalEvents}
        />
      </div>
    </div>
  );
}