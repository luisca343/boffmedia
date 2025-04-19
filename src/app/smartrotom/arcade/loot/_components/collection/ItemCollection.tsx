import { useState } from "react";
import { Item, Rarity } from "../../types";
import { X } from "lucide-react";
import { CollectionFilters } from "./CollectionFilters";
import { CollectionStats } from "./CollectionStats";
import { CollectionGrid } from "./CollectionGrid";
import { CollectionPagination } from "./CollectionPagination";
import { ItemDetailModal } from "./ItemDetailModal";
import { useCollectionFilters } from "../../_hooks/useCollectionFilter";

interface ItemCollectionProps {
  items: Item[];
  onClose: () => void;
}

export default function ItemCollection({ items, onClose }: ItemCollectionProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  const {
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
  } = useCollectionFilters(items);

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
  };

  return (
    <div className="bg-gray-900/90 border-2 border-cyan-500/30 shadow-xl rounded-lg p-6 w-full max-h-[80vh] overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
          Tu Colección
        </h2>
        <button 
          onClick={onClose}
          className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full border border-gray-700 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Filters and search */}
      <CollectionFilters 
        selectedRarity={selectedRarity}
        onRarityChange={handleRarityFilter}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />
      
      {/* Item count */}
      <CollectionStats 
        totalCount={items.length}
        filteredCount={filteredItems.length}
        displayedCount={paginatedItems.length}
        selectedRarity={selectedRarity}
      />
      
      {/* Items grid */}
      <div className="overflow-y-auto flex-grow bg-gray-950/50 p-4 rounded-lg border border-gray-800">
        <CollectionGrid 
          items={paginatedItems} 
          totalItems={items.length}
          onItemClick={handleItemClick} 
        />
      </div>
      
      {/* Pagination */}
      <CollectionPagination
        currentPage={currentPage}
        pageCount={pageCount}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
      />
      
      {/* Item detail modal */}
      <ItemDetailModal 
        item={selectedItem} 
        onClose={() => setSelectedItem(null)} 
      />
    </div>
  );
}