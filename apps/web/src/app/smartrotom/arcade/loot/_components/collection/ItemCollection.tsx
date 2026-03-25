import { useState } from "react";
import { Gift, X } from "lucide-react";
import { CollectionFilters } from "./CollectionFilters";
import { CollectionStats } from "./CollectionStats";
import { CollectionGrid } from "./CollectionGrid";
import { CollectionPagination } from "./CollectionPagination";
import { ItemDetailModal } from "./ItemDetailModal";
import { ClaimRewardsModal } from "./ClaimRewardsModal";
import { useCollectionFilters } from "../../_hooks/useCollectionFilter";
import { ArcadeInventoryItem } from "@/generated/api";

interface ItemCollectionProps {
  items: ArcadeInventoryItem[];
  onClose: () => void;
  uuid: string;
  onInventoryUpdate?: () => void;
}

export default function ItemCollection({ items, onClose, uuid, onInventoryUpdate }: ItemCollectionProps) {
  const [selectedItem, setSelectedItem] = useState<ArcadeInventoryItem | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [localItems, setLocalItems] = useState<ArcadeInventoryItem[]>(items);
  
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
  } = useCollectionFilters(localItems);

  // Filter claimable items (not chests or boxes)
  const claimableItems = localItems.filter(item => 
    !item.itemId.toLowerCase().includes('chest') && 
    !item.itemId.toLowerCase().includes('box')
  );

  const handleItemClick = (item: ArcadeInventoryItem) => {
    setSelectedItem(item);
  };

  const handleClaimSuccess = (claimedItemIds: string[]) => {
    // Update local state by removing claimed items
    setLocalItems(prevItems => 
      prevItems.filter(item => !claimedItemIds.includes(item.itemId))
    );
    
    // Also call parent update function if provided
    if (onInventoryUpdate) {
      onInventoryUpdate();
    }
  };

  return (
    <div className="bg-surface-900/90 border-2 border-cyan-500/30 shadow-xl rounded-lg p-6 w-full max-h-[80vh] overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-secondary-400">
          Tu Colección
        </h2>
        <div className="flex space-x-3">
          {claimableItems.length > 0 && (
            <button 
              onClick={() => setShowClaimModal(true)}
              className="bg-cyan-900/60 hover:bg-cyan-800 text-cyan-300 py-2 px-3 rounded-lg border border-cyan-700/50 flex items-center"
            >
              <Gift size={16} className="mr-1" />
              <span>Reclamar ({claimableItems.length})</span>
            </button>
          )}
          <button 
            onClick={onClose}
            className="bg-surface-800 hover:bg-surface-700 text-white p-2 rounded-full border border-surface-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
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
        totalCount={localItems.length}
        filteredCount={filteredItems.length}
        displayedCount={paginatedItems.length}
        selectedRarity={selectedRarity}
      />
      
      {/* Items grid */}
      <div className="overflow-y-auto flex-grow bg-surface-950/50 p-4 rounded-lg border border-surface-800">
        <CollectionGrid 
          items={paginatedItems} 
          totalItems={localItems.length}
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
      {selectedItem && (
        <ItemDetailModal 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
        />
      )}

      {/* Claim rewards modal */}
      {showClaimModal && (
        <ClaimRewardsModal 
          items={claimableItems} 
          onClose={() => setShowClaimModal(false)} 
          onClaimSuccess={handleClaimSuccess}
          uuid={uuid}
        />
      )}
    </div>
  );
}