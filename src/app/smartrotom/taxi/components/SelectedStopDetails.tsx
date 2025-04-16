import { FaMapMarkerAlt, FaWalking, FaTimes, FaTaxi, FaCoins } from 'react-icons/fa'
import { TaxiStop } from "@/types/dto/taxi-stop.dto"
import { formatMoney } from '../../starbank/bankUtils';

interface Position {
  x: number;
  z: number;
}

interface SelectedStopDetailsProps {
  selectedStop: TaxiStop;
  playerPosition: Position;
  playerMoney: number;
  calculateDistance: (x1: number, z1: number, x2: number, z2: number) => number;
  calculatePrice: (distance: number) => number;
  formatDistance: (distance: number) => string;
  teleportPlayer: (stop: TaxiStop) => Promise<void>;
  isLoading: boolean;
  onClose: () => void;
}

export default function SelectedStopDetails({
  selectedStop,
  playerPosition,
  playerMoney,
  calculateDistance,
  calculatePrice,
  formatDistance,
  teleportPlayer,
  isLoading,
  onClose
}: SelectedStopDetailsProps) {
  const distance = calculateDistance(playerPosition.x, playerPosition.z, selectedStop.x, selectedStop.z);
  const price = calculatePrice(distance);
  const canAfford = playerMoney >= price;
  
  return (
    <div className="absolute left-4 right-4 bottom-4 bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border-2 border-yellow-400 z-30 animate-appear">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-3 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-yellow-400 mr-3">
              <FaMapMarkerAlt className="text-white" />
            </div>
            <h3 className="text-xl font-bold">{selectedStop.id}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            aria-label="Close details"
          >
            <FaTimes />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <p className="text-blue-100 mb-4">{selectedStop.description || "Sin descripción disponible"}</p>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white/10 p-3 rounded-lg text-center backdrop-blur-sm border border-white/20">
            <div className="flex items-center justify-center mb-1 text-blue-300">
              <FaMapMarkerAlt className="mr-1" />
              <span className="font-medium">Ubicación</span>
            </div>
            <div className="text-white">
              X: {selectedStop.x}, Z: {selectedStop.z}
            </div>
          </div>
          
          <div className="bg-white/10 p-3 rounded-lg text-center backdrop-blur-sm border border-white/20">
            <div className="flex items-center justify-center mb-1 text-blue-300">
              <FaWalking className="mr-1" /> 
              <span className="font-medium">Distancia</span>
            </div>
            <div className="text-white">
              {formatDistance(distance)} bloques
            </div>
          </div>
          
          <div className="bg-white/10 p-3 rounded-lg text-center backdrop-blur-sm border border-white/20">
            <div className="flex items-center justify-center mb-1 text-yellow-400">
              <FaCoins className="mr-1" /> 
              <span className="font-medium">Precio</span>
            </div>
            <div className={`font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
              {formatMoney(price)}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => teleportPlayer(selectedStop)}
          disabled={!canAfford || isLoading}
          className={`
            w-full py-3 rounded-lg font-medium flex items-center justify-center
            ${canAfford && !isLoading
              ? 'bg-yellow-500 hover:bg-yellow-600 text-[#041F4E] shadow-md' // Changed from text-white to text-[#041F4E]
              : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
            }
          `}
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
            <span className="flex items-center">
              <FaTaxi className="mr-2" /> {canAfford ? 'Viajar a este destino' : 'Fondos insuficientes'}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}