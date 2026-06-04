"use client"

import { useState } from 'react';
import { useGetEvents } from '@/hooks/events/useGetEvents';
import { SectionHeader, SectionLoading, SectionFilters, SectionError, SectionEmpty } from '@/components/boffmedia-old/sections';
import { EventsGrid } from './_components/EventsGrid';
import { EventsList } from './_components/EventsList';
import { EventFilters } from './_components/EventFilters';
import { Trophy } from 'lucide-react';

export default function EventsPage() {
  const { events, error, isLoading, refetch } = useGetEvents();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string | null>(null);

  // Filter events based on search and filter
  const filteredEvents = events
    ? events.filter((event: any) => {
        // Search filter
        const matchesSearch = searchTerm 
          ? event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (event.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
          : true;
        
        // Game type filter
        const matchesFilter = filter ? event.gameId === parseInt(filter) : true;
        
        return matchesSearch && matchesFilter;
      })
    : [];

  if (isLoading) return <SectionLoading text="Cargando eventos..." subtext="Preparando experiencias épicas" />;
  if (error) return <SectionError error={error} onRetry={refetch} description="Error al cargar los eventos" />;
  if (!events || events.length === 0) return <SectionEmpty icon={Trophy} title="No hay eventos disponibles" description="Estamos preparando nuevos eventos emocionantes. ¡Vuelve pronto!" />;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <SectionHeader 
        title="Centro de Eventos"
        subtitle="Únete a competiciones épicas, desafía a otros jugadores y demuestra tu habilidad en eventos emocionantes."
      >
        <SectionFilters 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar evento..."
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          itemsCount={filteredEvents.length}
          itemsLabel="eventos"
          showViewMode={true}
          showItemsCount={true}
        >
          <EventFilters 
            filter={filter}
            onFilterChange={setFilter}
            eventsCount={filteredEvents.length}
          />
        </SectionFilters>
      </SectionHeader>
      
      {filteredEvents.length === 0 ? (
        <SectionEmpty 
          icon={Trophy}
          searchTerm={searchTerm} 
          onClearSearch={() => setSearchTerm('')}
          title="No se encontraron eventos"
          description={searchTerm 
            ? `No encontramos eventos que coincidan con "${searchTerm}". Prueba con otros términos de búsqueda.`
            : "No hay eventos que coincidan con los filtros seleccionados."
          }
        />
      ) : viewMode === 'grid' ? (
        <EventsGrid events={filteredEvents} />
      ) : (
        <EventsList events={filteredEvents} />
      )}
    </div>
  );
}