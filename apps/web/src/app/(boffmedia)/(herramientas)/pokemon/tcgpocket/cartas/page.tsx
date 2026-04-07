"use client";

import { PtcgpService } from "@/services/api/boffmedia/ptcgpService";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useMemo, useCallback } from "react";
import { CardGrid } from "../_components/CardGrid";
import { FilterComponent } from "../_components/FilterComponent";
import { TcgCard } from "@boffmedia/shared";
import { Button } from "@/components/ui/primitives/button";

interface Set {
  setId: string;
  setName: string;
  cardCount: number;
  cards: TcgCard[];
}

const CARDS_PER_PAGE = 50; // Limit cards per page

export default function CartasPage() {
  const [sets, setSets] = useState<Set[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expansionFilter, setExpansionFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCardsCount, setVisibleCardsCount] = useState(CARDS_PER_PAGE);
  const t = useTranslations("tcgpocket");
  const locale = useLocale();

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await PtcgpService.getAllCardsForSeriesGrouped("tcgp", locale);
        setSets(response.data || []);
      } catch (err) {
        setError("Failed to load cards");
        console.error("Error fetching cards:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [locale]);

  // Reset visible cards when filters change
  useEffect(() => {
    setVisibleCardsCount(CARDS_PER_PAGE);
  }, [searchTerm, expansionFilter]);

  // Memoize expensive calculations
  const allExpansions = useMemo(() => 
    sets.map(set => set.setId), 
    [sets]
  );

  const filteredSets = useMemo(() => {
    if (!searchTerm && !expansionFilter) return sets;
    
    return sets.map(set => ({
      ...set,
      cards: set.cards.filter((card: TcgCard) =>
        (card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.id.includes(searchTerm)) &&
        (expansionFilter === "" || set.setId === expansionFilter)
      )
    })).filter(set => set.cards.length > 0);
  }, [sets, searchTerm, expansionFilter]);

  // Limit visible cards for performance
  const visibleSets = useMemo(() => {
    let cardCount = 0;
    const result = [];
    
    for (const set of filteredSets) {
      const remainingCards = visibleCardsCount - cardCount;
      if (remainingCards <= 0) break;
      
      const visibleCards = set.cards.slice(0, remainingCards);
      if (visibleCards.length > 0) {
        result.push({
          ...set,
          cards: visibleCards
        });
        cardCount += visibleCards.length;
      }
    }
    
    return result;
  }, [filteredSets, visibleCardsCount]);

  const totalCards = useMemo(() => 
    filteredSets.reduce((acc, set) => acc + set.cards.length, 0),
    [filteredSets]
  );

  const hasMoreCards = visibleCardsCount < totalCards;

  // Use callback to prevent unnecessary re-renders
  const handleFilterChange = useCallback((name: string, expansion: string) => {
    setSearchTerm(name);
    setExpansionFilter(expansion);
  }, []);

  const loadMoreCards = useCallback(() => {
    setVisibleCardsCount(prev => prev + CARDS_PER_PAGE);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-xl text-surface-300">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-xl text-red-400">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
          >
            {t("retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-primary-300">
          {t("cardsList.pageTitle")}
        </h1>
        <FilterComponent
          expansions={allExpansions}
          onFilterChange={handleFilterChange}
          t={t}
        />
        
        {/* Show cards count */}
        <div className="mt-4 text-surface-400">
          Showing {Math.min(visibleCardsCount, totalCards)} of {totalCards} cards
        </div>
      </div>

      {visibleSets.map((set) => (
        <div key={set.setId} className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-primary-300">
            {set.setName}
          </h2>
          <CardGrid
            cards={set.cards}
            trans={t}
            linkTo={(card) =>
              `/tcgpocket/cartas/${card.id}`
            }
            allColored={true}
          />
        </div>
      ))}

      {/* Load more button */}
      {hasMoreCards && (
        <div className="text-center mt-8">
          <Button
            onClick={loadMoreCards}
          >
            Load More Cards ({totalCards - visibleCardsCount} remaining)
          </Button>
        </div>
      )}

      {filteredSets.length === 0 && (
        <p className="text-center text-surface-300 text-xl mt-8">
          {t("cardsList.noResults")}
        </p>
      )}
    </div>
  );
}