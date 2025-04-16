import { FaMapMarkerAlt, FaInfoCircle, FaArrowRight, FaSearch, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa'
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
  setSelectedStop: (stop: TaxiStop) => void;
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
    <div className="bg-blue-50 rounded-xl shadow-lg h-full overflow-y-auto">
      <div className="p-4 bg-blue-200 sticky top-0 z-10 rounded-t-xl">
        <h2 className="text-xl font-semibold text-blue-800">Destinos Disponibles</h2>
        <p className="text-blue-700 mb-3">Elige un destino para viajar en taxi</p>
        
        {/* Search and filter controls */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600" />
            <input
              type="text"
              placeholder="Buscar destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === 'nearest' ? 'furthest' : 'nearest')}
            className="px-4 py-2 bg-white hover:bg-blue-100 border border-blue-300 rounded-lg flex items-center justify-center transition-colors"
          >
            {sortOrder === 'nearest' ? (
              <>
                <FaSortAmountDown className="mr-2 text-blue-600" />
                <span>Más cercano</span>
              </>
            ) : (
              <>
                <FaSortAmountUp className="mr-2 text-blue-600" />
                <span>Más lejano</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="p-4">
        {filteredAndSortedStops.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No se encontraron destinos que coincidan con tu búsqueda</p>
          </div>
        ) : (
          filteredAndSortedStops.map((stop) => {
            const price = calculatePrice(stop.distance);
            const canAfford = playerMoney >= price;

            return (
              <div 
                key={stop.id} 
                className={`mb-4 bg-white rounded-lg shadow-md overflow-hidden border-2 ${selectedStop?.id === stop.id ? 'border-blue-500' : 'border-transparent'}`}
                onClick={() => setSelectedStop(stop)}
              >
                <div className="p-4 flex justify-between items-center cursor-pointer">
                  <div className="flex items-center">
                    <div className="bg-blue-500 p-2 rounded-full mr-3">
                      <FaMapMarkerAlt className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{stop.id}</h3>
                      <p className="text-sm text-gray-500">Distancia: {formatDistance(stop.distance)} bloques</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${canAfford ? 'text-green-600' : 'text-red-500'}`}>
                      {formatMoney(price)}
                    </div>
                  </div>
                </div>

                {selectedStop?.id === stop.id && (
                  <div className="bg-blue-50 p-4 border-t border-blue-100">
                    <p className="mb-3 text-gray-600">{stop.description}</p>
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <FaInfoCircle className="mr-1" /> 
                      Coordenadas: X: {stop.x}, Z: {stop.z}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        teleportPlayer(stop);
                      }}
                      disabled={!canAfford || isLoading}
                      className={`w-full py-2 px-4 rounded-md flex items-center justify-center ${
                        canAfford && !isLoading 
                          ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? (
                        <span>Viajando...</span>
                      ) : (
                        <>
                          <span>{canAfford ? 'Viajar ahora' : 'Fondos insuficientes'}</span>
                          {canAfford && <FaArrowRight className="ml-2" />}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}