import { FaHistory, FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import { TaxiStop } from "@boffmedia/shared";

interface RecentDestinationsProps {
  recentStops: TaxiStop[];
  onSelectStop: (stop: TaxiStop) => void;
}

export default function RecentDestinations({ recentStops, onSelectStop }: RecentDestinationsProps) {
  if (recentStops.length === 0) return null;
  
  return (
    <div className="mb-4 bg-white/10 backdrop-blur-sm rounded-lg shadow-md overflow-hidden border border-white/20">
      <div className="bg-gradient-to-r from-secondary-active/70 to-secondary-soft/70 p-3">
        <h3 className="flex items-center text-md font-medium text-white">
          <FaHistory className="mr-2 text-yellow-400" />
          Destinos recientes
        </h3>
      </div>
      
      <div className="p-3">
        <div className="flex overflow-x-auto pb-2 gap-2">
          {recentStops.map(stop => (
            <button
              key={stop.id}
              onClick={() => onSelectStop(stop)}
              className="flex items-center px-3 py-2 bg-white/10 hover:bg-secondary-active/30 border border-white/10 hover:border-secondary/50 rounded-lg whitespace-nowrap transition-colors group"
            >
              <div className="bg-red-500 group-hover:bg-yellow-400 p-1 rounded-full mr-2 transition-colors">
                <FaMapMarkerAlt className="text-white text-xs" />
              </div>
              <span className="font-medium text-white">{stop.id}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}