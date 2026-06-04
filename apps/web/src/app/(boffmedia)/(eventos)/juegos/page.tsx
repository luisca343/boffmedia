"use client"

import { useState } from 'react';
import { useGetGames } from '@/hooks/events/useGetGames';
import { SectionHeader, SectionLoading, SectionFilters, SectionError, SectionEmpty } from '@/components/boffmedia-old/sections';
import { GamesGrid } from './_components/GamesGrid';
import { GamesList } from './_components/GamesList';
import { GameFilters } from './_components/GameFilters';
import { Gamepad2 } from 'lucide-react';

export default function GamesPage() {
  const { games, error, isLoading, refetch } = useGetGames();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string | null>(null);

  // Filter games based on search and filter
  const filteredGames = games
    ? games.filter((game: any) => {
        // Search filter
        const matchesSearch = searchTerm 
          ? game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (game.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
          : true;
        
        // Status filter
        const matchesFilter = filter 
          ? (filter === 'active' && game.active === 1) ||
            (filter === 'inactive' && game.active === 0)
          : true;
        
        return matchesSearch && matchesFilter;
      })
    : [];

  if (isLoading) return <SectionLoading text="Cargando juegos..." subtext="Preparando experiencias de juego increíbles" />;
  if (error) return <SectionError error={error} onRetry={refetch} description="Error al cargar los juegos" />;
  if (!games || games.length === 0) return <SectionEmpty icon={Gamepad2} title="No hay juegos disponibles" description="Estamos trabajando en agregar nuevos juegos emocionantes. ¡Vuelve pronto!" />;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <SectionHeader 
        title="Centro de Juegos"
        subtitle="Descubre todos los juegos disponibles en nuestra plataforma. Desde aventuras épicas hasta competiciones multijugador."
      >
        <SectionFilters 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar juego..."
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          itemsCount={filteredGames.length}
          itemsLabel="juegos"
          showViewMode={true}
          showItemsCount={true}
        >
          <GameFilters 
            filter={filter}
            onFilterChange={setFilter}
            gamesCount={filteredGames.length}
          />
        </SectionFilters>
      </SectionHeader>
      
      {filteredGames.length === 0 ? (
        <SectionEmpty 
          icon={Gamepad2}
          searchTerm={searchTerm} 
          onClearSearch={() => setSearchTerm('')}
          title="No se encontraron juegos"
          description={searchTerm 
            ? `No encontramos juegos que coincidan con "${searchTerm}". Prueba con otros términos de búsqueda.`
            : "No hay juegos que coincidan con los filtros seleccionados."
          }
        />
      ) : viewMode === 'grid' ? (
        <GamesGrid games={filteredGames} />
      ) : (
        <GamesList games={filteredGames} />
      )}
    </div>
  );
}
