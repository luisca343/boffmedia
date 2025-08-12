import { FaMapMarkerAlt, FaInfoCircle, FaArrowRight, FaSearch, FaSortAmountDown, FaSortAmountUp, FaTaxi, FaCompass } from 'react-icons/fa'
import { TaxiStop } from "@/types/dto/taxi-stop.dto"
import { useState, useMemo } from 'react'
import { formatMoney } from '../../starbank/bankUtils';

interface Position {
  x: number;
  z: number;
}

interface ListViewProps {
  taxiStops: TaxiStop[];
  playerPosition: Position;
  playerMoney: number;
  selectedStop: TaxiStop | null;
  setSelectedStop: (stop: TaxiStop | null) => void;
  calculateDistance: (x1: number, z1: number, x2: number, z2: number) => number;
  calculatePrice: (distance: number) => number;
  formatDistance: (distance: number) => string;
  teleportPlayer: (stop: TaxiStop) => Promise<void>;
  isLoading: boolean;
}

export default function ListView({ 
  taxiStops, 
  playerPosition, 
  playerMoney,
  selectedStop, 
  setSelectedStop,
  calculateDistance,
  calculatePrice,
  formatDistance,
  teleportPlayer,
  isLoading
}: ListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'nearest' | 'furthest'>('nearest');

  // Calculate distances and filter/sort based on search term and sort order
  const filteredAndSortedStops = useMemo(() => {
    // Add distance to each stop
    const stopsWithDistance = taxiStops.map(stop => ({
      ...stop,
      distance: calculateDistance(playerPosition.x, playerPosition.z, stop.x, stop.z)
    }));

    // Filter by search term
    const filtered = stopsWithDistance.filter(stop => 
      stop.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (stop.description && stop.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort by distance
    return filtered.sort((a, b) => 
      sortOrder === 'nearest' ? a.distance - b.distance : b.distance - a.distance
    );
  }, [taxiStops, searchTerm, sortOrder, playerPosition, calculateDistance]);

  return (
    <div className="relative bg-white rounded-xl shadow-xl h-full flex flex-col overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-secondary-600 to-secondary-800 rounded-t-xl">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Destinos Disponibles</h2>
            <p className="text-secondary-100">Elige un destino para viajar en taxi</p>
          </div>
          <div className="flex items-center bg-secondary-500/50 px-3 py-1 rounded-full">
            <FaCompass className="text-white mr-2" />
            <span className="text-white font-medium">
              {filteredAndSortedStops.length} destinos
            </span>
          </div>
        </div>
        
        {/* Search and filter controls */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-300" />
            <input
              type="text"
              placeholder="Buscar destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-yellow-300 bg-white/90"
            />
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === 'nearest' ? 'furthest' : 'nearest')}
            className="px-4 py-2 bg-secondary-500 hover:bg-secondary-600 text-white rounded-lg flex items-center justify-center transition-colors"
          >
            {sortOrder === 'nearest' ? (
              <>
                <FaSortAmountDown className="mr-2" />
                <span>Más cercano</span>
              </>
            ) : (
              <>
                <FaSortAmountUp className="mr-2" />
                <span>Más lejano</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* List content area with clean background */}
      <div className="flex-grow relative bg-surface-50 overflow-y-auto">
        <div className="absolute inset-0 bg-[#041F4E] overflow-y-auto">
          {/* Removed grid lines - clean background */}
          
          {/* Actual content container */}
          <div className="relative p-4">
            {filteredAndSortedStops.length === 0 ? (
              <div className="text-center py-12 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="w-16 h-16 mx-auto bg-secondary-800/50 rounded-full flex items-center justify-center mb-4">
                  <FaMapMarkerAlt className="text-white/70 text-2xl" />
                </div>
                <p className="text-white/90 font-medium">No se encontraron destinos que coincidan con tu búsqueda</p>
                <button 
                  className="mt-4 text-yellow-400 hover:text-yellow-300 font-medium" 
                  onClick={() => setSearchTerm('')}
                >
                  Mostrar todos los destinos
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAndSortedStops.map((stop) => {
                  const price = calculatePrice(stop.distance);
                  const canAfford = playerMoney >= price;
                  const isSelected = selectedStop?.id === stop.id;

                  return (
                    <div 
                      key={stop.id} 
                      className={`bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden transition-all border ${
                        isSelected 
                          ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]' 
                          : 'border-white/20 hover:border-secondary-300/50'
                      }`}
                      onClick={() => setSelectedStop(isSelected ? null : stop)}
                    >
                      <div className="p-3 flex justify-between items-center cursor-pointer">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-full mr-3 ${
                            isSelected ? 'bg-yellow-400' : 'bg-red-500'
                          }`}>
                            <FaMapMarkerAlt className="text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white">{stop.id}</h3>
                            <p className="text-sm text-secondary-100">Distancia: {formatDistance(stop.distance)} bloques</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${canAfford ? 'text-highlight-400' : 'text-red-400'}`}>
                            {formatMoney(price)}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="bg-white/5 p-4 border-t border-white/10">
                          <p className="mb-4 text-secondary-100">{stop.description || "Sin descripción disponible"}</p>
                          <div className="flex items-center text-sm text-secondary-200 mb-4">
                            <FaInfoCircle className="mr-2 text-secondary-300" /> 
                            <span>Coordenadas: X: {stop.x}, Z: {stop.z}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              teleportPlayer(stop);
                            }}
                            disabled={!canAfford || isLoading}
                            className={`w-full py-3 px-4 rounded-md flex items-center justify-center font-medium transition-colors ${
                              canAfford && !isLoading 
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-[#041F4E] shadow-md' // Changed from text-white to text-[#041F4E]
                                : 'bg-surface-600/50 text-surface-400 cursor-not-allowed'
                            }`}
                          >
                            {isLoading ? (
                              <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-white">Viajando...</span> {/* Keep this white since it appears during loading state with different bg */}
                              </span>
                            ) : (
                              <>
                                <FaTaxi className="mr-2" />
                                <span>{canAfford ? 'Viajar ahora' : 'Fondos insuficientes'}</span>
                                {canAfford && <FaArrowRight className="ml-2" />}
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}