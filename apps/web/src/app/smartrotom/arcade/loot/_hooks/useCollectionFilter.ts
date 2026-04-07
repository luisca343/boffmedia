import { useState, useMemo } from 'react';
import { rarityOrder } from '../_utils/rarityConfig';
import { ArcadeInventoryItem } from '@boffmedia/shared';

const ITEMS_PER_PAGE = 16;

export function useCollectionFilters(items: ArcadeInventoryItem[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<ArcadeInventoryItem.rarity | "all">("all");
  const [currentPage, setCurrentPage] = useState(0);
  
  // Filter and sort items
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      (selectedRarity === "all" || item.rarity === selectedRarity) &&
      item.itemId.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });
  }, [items, selectedRarity, searchTerm]);
  

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  
  const paginatedItems = useMemo(() => {
    return filteredItems.slice(
      currentPage * ITEMS_PER_PAGE,
      (currentPage + 1) * ITEMS_PER_PAGE
    );
  }, [filteredItems, currentPage]);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(pageCount - 1, prev + 1));
  };

  const handleRarityFilter = (rarity: ArcadeInventoryItem.rarity | "all") => {
    setSelectedRarity(rarity);
    setCurrentPage(0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0);
  };

  return {
    searchTerm,
    selectedRarity,
    currentPage,
    pageCount,
    filteredItems,
    paginatedItems,
    handlePreviousPage,
    handleNextPage,
    handleRarityFilter,
    handleSearchChange
  };
}