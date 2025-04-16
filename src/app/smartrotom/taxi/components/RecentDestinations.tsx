import { FaHistory, FaMapMarkerAlt } from 'react-icons/fa';
import { TaxiStop } from "@/types/dto/taxi-stop.dto";

interface RecentDestinationsProps {
  recentStops: TaxiStop[];
  onSelectStop: (stop: TaxiStop) => void;
}

export default function RecentDestinations({ recentStops, onSelectStop }: RecentDestinationsProps) {
  if (recentStops.length === 0) return null;
  
  return (
    <div className="mb-4 p-3 bg-white rounded-lg shadow-md">
      <h3 className="flex items-center text-md font-medium text-gray-700 mb-2">
        <FaHistory className="mr-2 text-blue-600" />
        Destinos recientes
      </h3>
      
      <div className="flex overflow-x-auto pb-2 gap-2">
        {recentStops.map(stop => (
          <button
            key={stop.id}
            onClick={() => onSelectStop(stop)}
            className="flex items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg whitespace-nowrap hover:bg-blue-100 transition-colors"
          >
            <FaMapMarkerAlt className="mr-2 text-blue-600" />
            <span>{stop.id}</span>
          </button>
        ))}
      </div>
    </div>
  )
}