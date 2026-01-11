"use client"

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useGetEvents } from '@/hooks/events/useGetEvents';
import { SectionHeader, SectionLoading, SectionFilters, SectionError, SectionEmpty } from '@/components/boffmedia/sections';
import { EventsGrid } from './_components/EventsGrid';
import { EventsList } from './_components/EventsList';
import { EventFilters } from './_components/EventFilters';
import { Trophy } from 'lucide-react';

export default function EventsPage() {
  const t = useTranslations('boffmedia');
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

  if (isLoading) return <SectionLoading text={t('eventsSection.loading')} subtext="Preparando experiencias épicas" />;
  if (error) return <SectionError error={error} onRetry={refetch} description={t('eventsSection.errorLoading')} />;
  if (!events || events.length === 0) return <SectionEmpty icon={Trophy} title={t('eventsSection.empty.noEvents')} description={t('eventsSection.empty.noEventsDescription')} />;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <SectionHeader 
        title={t('eventsSection.title')}
        subtitle={t('eventsSection.subtitle')}
      >
        <SectionFilters 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={t('eventsSection.searchPlaceholder')}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          itemsCount={filteredEvents.length}
          itemsLabel={t('eventsSection.itemsLabel')}
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
          title={searchTerm ? t('eventsSection.empty.noResults') : t('eventsSection.empty.noEvents')}
          description={searchTerm ? t('eventsSection.empty.noResultsDescription', { term: searchTerm }) : t('eventsSection.noEventsMatchFilters')}
        />
      ) : viewMode === 'grid' ? (
        <EventsGrid events={filteredEvents} />
      ) : (
        <EventsList events={filteredEvents} />
      )}
    </div>
  );
}