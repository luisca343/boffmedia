import { useState } from 'react';
import { FaHistory, FaMapMarkedAlt, FaCoins, FaChevronDown, FaChevronUp, FaTaxi } from 'react-icons/fa';
import { formatMoney } from '../../starbank/bankUtils';

interface TripRecord {
  id: string;
  destination: string;
  date: Date;
  price: number;
  fromX: number;
  fromZ: number;
  toX: number;
  toZ: number;
}

interface TravelHistoryProps {
  trips: TripRecord[];
}

export default function TravelHistory({ trips }: TravelHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleExpansion = () => setIsExpanded(!isExpanded);
  
  // Calculate total spent on taxi
  const totalSpent = trips.reduce((sum, trip) => sum + trip.price, 0);
  
  if (trips.length === 0) return null;
  
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-md overflow-hidden mb-4 border border-white/20">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary-soft/30 bg-gradient-to-r from-secondary-active/70 to-secondary-soft/70"
        onClick={toggleExpansion}
      >
        <div className="flex items-center">
          <div className="bg-yellow-500 p-2 rounded-full mr-3">
            <FaTaxi className="text-white text-sm" />
          </div>
          <div>
            <h3 className="font-bold text-white">Historial de viajes</h3>
            <p className="text-sm text-secondary-hover">{trips.length} viajes - {formatMoney(totalSpent)} gastados</p>
          </div>
        </div>
        {isExpanded ? 
          <FaChevronUp className="text-secondary-hover" /> : 
          <FaChevronDown className="text-secondary-hover" />
        }
      </div>
      
      {isExpanded && (
        <div className="border-t border-white/10 divide-y divide-white/10">
          {trips.map((trip) => (
            <div key={trip.id} className="p-3 hover:bg-secondary-soft/20">
              <div className="flex justify-between items-center">
                <div className="font-medium text-white">{trip.destination}</div>
                <div className="text-warning-hover font-medium">{formatMoney(trip.price)}</div>
              </div>
              <div className="flex justify-between text-sm text-secondary-hover mt-1">
                <div>{new Date(trip.date).toLocaleDateString()}</div>
                <div className="flex items-center">
                  <FaMapMarkedAlt className="mr-1 text-secondary-hover" />
                  <span>({trip.fromX}, {trip.fromZ}) → ({trip.toX}, {trip.toZ})</span>
                </div>
              </div>
            </div>
          ))}
          
          {trips.length > 5 && (
            <div className="text-center p-3 border-t border-white/10">
              <button className="text-yellow-400 hover:text-yellow-300 font-medium">
                Ver historial completo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}