"use client"

import { useState } from 'react';
import { useGetEvents } from '@/hooks/events/useGetEvents';
import { EventsHeader } from './_components/EventsHeader';
import { EventsGrid } from './_components/EventsGrid';
import { EventsList } from './_components/EventsList';
import { EventsEmpty } from './_components/EventsEmpty';
import { EventsLoading } from './_components/EventsLoading';
import { EventsError } from './_components/EventsError';

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

  if (isLoading) return <EventsLoading />;
  if (error) return <EventsError error={error} onRetry={refetch} />;
  if (!events || events.length === 0) return <EventsEmpty />;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <EventsHeader 
        totalEvents={filteredEvents.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filter={filter}
        onFilterChange={setFilter}
      />
      
      {filteredEvents.length === 0 ? (
        <EventsEmpty searchTerm={searchTerm} onClearSearch={() => setSearchTerm('')} />
      ) : viewMode === 'grid' ? (
        <EventsGrid events={filteredEvents} />
      ) : (
        <EventsList events={filteredEvents} />
      )}
    </div>
  );
}