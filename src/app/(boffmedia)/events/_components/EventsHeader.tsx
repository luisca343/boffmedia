import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, Grid, List, Filter, Trophy, Star } from "lucide-react";
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
    <div className="relative">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-accent-500/10 rounded-full blur-2xl"></div>
        <div className="absolute top-0 right-20 w-40 h-40 bg-secondary-500/10 rounded-full blur-2xl"></div>
      </div>

      <div className="mb-12">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <div className="inline-block relative">
            <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 via-highlight-400 to-info-400 mb-4">
              Centro de Eventos
            </h1>
            <div className="h-1 w-32 bg-gradient-to-r from-accent-500 to-highlight-400 mx-auto rounded-full"></div>
            
            {/* Floating icons around title */}
            <div className="absolute -top-6 -left-12 w-8 h-8 bg-gradient-to-br from-accent-500 to-highlight-600 rounded-full flex items-center justify-center animate-bounce">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -top-6 -right-12 w-8 h-8 bg-gradient-to-br from-secondary-500 to-info-600 rounded-full flex items-center justify-center animate-bounce" style={{animationDelay: '0.5s'}}>
              <Star className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-xl text-surface-300 mt-6 max-w-3xl mx-auto">
            Descubre todos los eventos disponibles en nuestros servidores. Desde torneos épicos hasta construcciones comunitarias.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-surface-800/40 backdrop-blur-sm border border-accent-500/20 rounded-2xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-surface-400" />
              <Input
                placeholder="Buscar eventos épicos..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-12 h-12 bg-surface-700/50 border-surface-600 text-white placeholder-surface-400 text-lg focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500"
              />
            </div>
            
            {/* Filters and View Mode */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <EventFilters
                filter={filter}
                onFilterChange={onFilterChange}
                eventsCount={totalEvents}
              />
              
              {/* View Mode Toggle */}
              <div className="flex bg-surface-700/50 rounded-lg p-1 border border-surface-600">
                <Button
                  variant={viewMode === 'grid' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onViewModeChange('grid')}
                  className={`px-4 ${viewMode === 'grid' 
                    ? "bg-gradient-to-r from-accent-600 to-info-600 text-white" 
                    : "text-surface-300 hover:text-white hover:bg-surface-600"
                  }`}
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Tarjetas
                </Button>
                <Button
                  variant={viewMode === 'list' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onViewModeChange('list')}
                  className={`px-4 ${viewMode === 'list'
                    ? "bg-gradient-to-r from-accent-600 to-info-600 text-white"
                    : "text-surface-300 hover:text-white hover:bg-surface-600"
                  }`}
                >
                  <List className="h-4 w-4 mr-2" />
                  Lista
                </Button>
              </div>
            </div>
          </div>
          
          {/* Results Summary */}
          <div className="mt-4 pt-4 border-t border-surface-600/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-surface-300">
                Mostrando {totalEvents} {totalEvents === 1 ? 'evento' : 'eventos'}
                {filter && <span className="text-accent-400 ml-1">(filtrados)</span>}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                <span className="text-success-400 text-xs font-medium">ACTUALIZANDO EN TIEMPO REAL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}