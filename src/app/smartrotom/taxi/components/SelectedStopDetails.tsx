import { FaMapMarkerAlt, FaWalking, FaTimes } from 'react-icons/fa'
import { TaxiStop } from "@/types/dto/taxi-stop.dto"

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
  onClose: () => void; // New prop for closing the details
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
    <div className="absolute left-4 right-4 bottom-4 bg-white rounded-lg shadow-lg overflow-hidden border-2 border-yellow-400 z-30">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{selectedStop.id}</h3>
            <p className="text-gray-600 mb-2">{selectedStop.description}</p>
          </div>
          <div className="flex items-center">
            <div className="bg-yellow-100 px-3 py-1 rounded-full mr-2">
              <span className="text-yellow-800 font-medium">${price}</span>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full"
              aria-label="Close details"
            >
              <FaTimes />
            </button>
          </div>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <FaMapMarkerAlt className="mr-1" /> 
          X: {selectedStop.x}, Z: {selectedStop.z} 
          <span className="mx-2">•</span> 
          <FaWalking className="mr-1" /> 
          {formatDistance(distance)} bloques
        </div>
        
        <button
          onClick={() => teleportPlayer(selectedStop)}
          disabled={!canAfford || isLoading}
          className={`w-full py-3 rounded-md font-medium ${
            canAfford && !isLoading
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? 'Viajando...' : 'Viajar a este destino'}
        </button>
      </div>
    </div>
  )
}