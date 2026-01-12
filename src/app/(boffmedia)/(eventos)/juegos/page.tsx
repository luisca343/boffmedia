"use client"

import { useState } from 'react';
import { useGetGames } from '@/hooks/events/useGetGames';
import { SectionHeader, SectionLoading, SectionFilters, SectionError, SectionEmpty } from '@/components/boffmedia/sections';
import { useTranslations } from 'next-intl'
import { GamesGrid } from './_components/GamesGrid';
import { GamesList } from './_components/GamesList';
import { GameFilters } from './_components/GameFilters';
import { Gamepad2 } from 'lucide-react';

export default function GamesPage() {
  const { games, error, isLoading, refetch } = useGetGames();
  const t = useTranslations('boffmedia')
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

  if (isLoading) return <SectionLoading text={t('eventsSection.loadingGames')} subtext={t('eventsSection.preparingGames')} />;
  if (error) return <SectionError error={error} onRetry={refetch} description={t('eventsSection.errorLoadingGames')} />;
  if (!games || games.length === 0) return <SectionEmpty icon={Gamepad2} title={t('eventsSection.noGamesAvailable')} description={t('eventsSection.noGamesAvailableDesc')} />;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <SectionHeader 
        title={t('eventsSection.gamesCenterTitle')}
        subtitle={t('eventsSection.gamesCenterSubtitle')}
      >
        <SectionFilters 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={t('eventsSection.searchPlaceholderGames')}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          itemsCount={filteredGames.length}
          itemsLabel={t('eventsSection.gamesItemsLabel')}
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
          title={t('eventsSection.noGamesFoundTitle')}
          description={searchTerm 
            ? t('eventsSection.noGamesFoundForTerm', { term: searchTerm })
            : t('eventsSection.noGamesMatchFilters')
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
