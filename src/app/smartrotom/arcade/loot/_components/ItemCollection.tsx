import { useState } from "react";
import { Item, Rarity } from "./types";
import { X, Filter, Search, ChevronLeft, ChevronRight, Archive } from "lucide-react";
import { ItemDisplay } from "./ItemDisplay";
import { useTranslations } from "next-intl";
import { getItemRarity } from "@/lib/intlUtils";

interface ItemCollectionProps {
  items: Item[];
  onClose: () => void;
}

const ITEMS_PER_PAGE = 16;

const rarityOrder: Record<Rarity, number> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  uncommon: 3,
  common: 4
};

const rarityConfig: Record<Rarity, { bgColor: string, textColor: string, borderColor: string, glow: string }> = {
  common: { 
    bgColor: "bg-gray-800", 
    textColor: "text-gray-400", 
    borderColor: "border-gray-400/50",
    glow: ""
  },
  uncommon: { 
    bgColor: "bg-green-900/80", 
    textColor: "text-green-400", 
    borderColor: "border-green-400/50",
    glow: "shadow-sm shadow-green-500/20" 
  },
  rare: { 
    bgColor: "bg-blue-900/80", 
    textColor: "text-blue-400", 
    borderColor: "border-blue-400/50",
    glow: "shadow-md shadow-blue-500/30" 
  },
  epic: { 
    bgColor: "bg-purple-900/80", 
    textColor: "text-purple-400", 
    borderColor: "border-purple-400/50",
    glow: "shadow-lg shadow-purple-500/40"
  },
  legendary: { 
    bgColor: "bg-yellow-900/80", 
    textColor: "text-yellow-400", 
    borderColor: "border-yellow-400/50",
    glow: "shadow-xl shadow-yellow-500/50"
  }
};

export default function ItemCollection({ items, onClose }: ItemCollectionProps) {
  const t = useTranslations("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<Rarity | "all">("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Filter and sort items
  const filteredItems = items.filter(item => 
    (selectedRarity === "all" || item.rarity === selectedRarity) &&
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    // Sort by rarity (most rare first)
    return rarityOrder[a.rarity] - rarityOrder[b.rarity];
  });

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = filteredItems.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(pageCount - 1, prev + 1));
  };

  const handleRarityFilter = (rarity: Rarity | "all") => {
    setSelectedRarity(rarity);
    setCurrentPage(0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0);
  };

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
  };

  // Get the type based on item source
  const getItemType = (item: Item) => {
    return item.source === "arcade" ? "arcade" : "mina";
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
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-2 border border-gray-700">
          <Search className="text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar objeto..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="bg-transparent border-none text-white focus:outline-none w-full placeholder:text-gray-500"
          />
        </div>
        
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <Filter size={16} className="text-gray-400 mr-1" />
          {["all", "common", "uncommon", "rare", "epic", "legendary"].map((rarity) => {
            const isActive = selectedRarity === rarity;
            let styles;
            
            if (rarity === "all") {
              styles = isActive 
                ? "bg-white text-black" 
                : "bg-gray-800 text-gray-300 hover:bg-gray-700";
            } else {
              const config = rarityConfig[rarity as Rarity];
              styles = isActive 
                ? `${config.bgColor} ${config.textColor}` 
                : "bg-gray-800 text-gray-300 hover:bg-gray-700";
            }
            
            return (
              <button
                key={rarity}
                onClick={() => handleRarityFilter(rarity as Rarity | "all")}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap border ${isActive ? 'border-cyan-500/50' : 'border-gray-700'} ${styles}`}
              >
                {getItemRarity(t, rarity as Rarity)}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Item count */}
      <div className="text-gray-300 mb-4 flex items-center justify-between">
        <span>
          Mostrando {paginatedItems.length} de {filteredItems.length} objetos
          {selectedRarity !== "all" && ` (filtrado por ${
            selectedRarity === "common" ? "Comunes" :
            selectedRarity === "uncommon" ? "Poco comunes" :
            selectedRarity === "rare" ? "Raros" :
            selectedRarity === "epic" ? "Épicos" : "Legendarios"
          })`}
        </span>
        
        <span className="text-cyan-300 text-sm">
          {items.length} objetos en total
        </span>
      </div>
      
      {/* Items grid */}
      <div className="overflow-y-auto flex-grow bg-gray-950/50 p-4 rounded-lg border border-gray-800">
        {paginatedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-400 py-12">
            {items.length === 0 ? (
              <div className="text-center">
                <Archive className="h-16 w-16 mx-auto text-gray-600 mb-3" />
                <p className="text-xl mb-2">Aún no has coleccionado ningún objeto</p>
                <p className="text-gray-500">
                  Abre cajas para empezar a coleccionar objetos raros
                </p>
              </div>
            ) : (
              <div className="text-center">
                <Search className="h-16 w-16 mx-auto text-gray-600 mb-3" />
                <p className="text-xl mb-2">No hay objetos que coincidan con tu búsqueda</p>
                <p className="text-gray-500">
                  Intenta con otros términos o filtros
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {paginatedItems.map(item => {
              const config = rarityConfig[item.rarity];
              const itemType = getItemType(item);
              
              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`${config.bgColor} border-2 ${config.borderColor} rounded-lg p-3 flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-200 ${config.glow}`}
                >
                  <div className="w-full aspect-square mb-2 flex items-center justify-center">
                    <ItemDisplay
                      type={itemType}
                      itemId={item.id}
                      count={item.count}
                      size={96}
                      rarity={item.rarity}
                    />
                  </div>
                  
                  <h3 className={`${config.textColor} font-medium text-center text-sm truncate w-full`}>
                    {item.name}
                  </h3>
                  <p className={`${config.textColor} text-xs mt-1`}>
                    {getItemRarity(t, item.rarity)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
            className={`flex items-center space-x-1 px-3 py-1 rounded ${
              currentPage === 0
                ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                : "bg-blue-900/60 text-cyan-300 hover:bg-blue-800/80 border border-blue-700/50"
            }`}
          >
            <ChevronLeft size={16} />
            <span>Anterior</span>
          </button>
          
          <span className="text-gray-300">
            Página {currentPage + 1} de {pageCount}
          </span>
          
          <button
            onClick={handleNextPage}
            disabled={currentPage >= pageCount - 1}
            className={`flex items-center space-x-1 px-3 py-1 rounded ${
              currentPage >= pageCount - 1
                ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                : "bg-blue-900/60 text-cyan-300 hover:bg-blue-800/80 border border-blue-700/50"
            }`}
          >
            <span>Siguiente</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      
      {/* Item detail modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className={`${rarityConfig[selectedItem.rarity].bgColor} border-4 ${rarityConfig[selectedItem.rarity].borderColor} rounded-lg p-6 max-w-md w-full ${rarityConfig[selectedItem.rarity].glow}`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className={`${rarityConfig[selectedItem.rarity].textColor} text-2xl font-bold`}>
                {selectedItem.name}
              </h3>
              <button 
                onClick={() => setSelectedItem(null)}
                className="bg-gray-800 hover:bg-gray-700 text-white p-1 rounded-full border border-gray-700"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex flex-col items-center mb-6">
              <div className="w-48 h-48 mb-4 flex items-center justify-center bg-black/30 rounded-lg border border-gray-700">
                <ItemDisplay
                  type={getItemType(selectedItem)}
                  itemId={selectedItem.id}
                  count={selectedItem.count}
                  size={160}
                  rarity={selectedItem.rarity}
                />
                
                {/* Special effects for rare items applied directly in ItemDisplay */}
              </div>
              
              {selectedItem.count! > 1 && (
                <div className="mb-2 px-3 py-1 bg-black/50 rounded-md border border-gray-700">
                  <span className={`${rarityConfig[selectedItem.rarity].textColor} font-bold`}>
                    Cantidad: x{selectedItem.count}
                  </span>
                </div>
              )}
              
              <span className={`${rarityConfig[selectedItem.rarity].textColor} uppercase tracking-wider font-bold mb-3 px-3 py-1 rounded-full bg-black/30`}>
                {getItemRarity(t, selectedItem.rarity)}
              </span>
              
              <p className="text-gray-200 text-center bg-black/30 p-4 rounded-lg border border-gray-800">
                {selectedItem.description || `Un objeto ${selectedItem.rarity} de la colección.`}
              </p>
            </div>
            
            <button
              onClick={() => setSelectedItem(null)}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg border border-gray-700 font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}