import { FaMapMarkerAlt, FaInfoCircle, FaArrowRight } from 'react-icons/fa'
import { TaxiStop } from "@/types/dto/taxi-stop.dto"

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
  return (
    <div className="bg-yellow-50 rounded-xl shadow-lg h-full overflow-y-auto">
      <div className="p-4 bg-yellow-200 sticky top-0 z-10 rounded-t-xl">
        <h2 className="text-xl font-semibold text-yellow-800">Destinos Disponibles</h2>
        <p className="text-yellow-700">Elige un destino para viajar en taxi</p>
      </div>
      <div className="p-4">
        {taxiStops.map((stop) => {
          const distance = calculateDistance(playerPosition.x, playerPosition.z, stop.x, stop.z)
          const price = calculatePrice(distance)
          const canAfford = playerMoney >= price

          return (
            <div 
              key={stop.id} 
              className={`mb-4 bg-white rounded-lg shadow-md overflow-hidden border-2 ${selectedStop?.id === stop.id ? 'border-yellow-500' : 'border-transparent'}`}
              onClick={() => setSelectedStop(stop)}
            >
              <div className="p-4 flex justify-between items-center cursor-pointer">
                <div className="flex items-center">
                  <div className="bg-yellow-500 p-2 rounded-full mr-3">
                    <FaMapMarkerAlt className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{stop.id}</h3>
                    <p className="text-sm text-gray-500">Distancia: {formatDistance(distance)} bloques</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${canAfford ? 'text-green-600' : 'text-red-500'}`}>
                    ${price}
                  </div>
                </div>
              </div>

              {selectedStop?.id === stop.id && (
                <div className="bg-yellow-50 p-4 border-t border-yellow-100">
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
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
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
        })}
      </div>
    </div>
  )
}