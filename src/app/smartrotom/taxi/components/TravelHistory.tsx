import { useState } from 'react';
import { FaHistory, FaMapMarkedAlt, FaCoins, FaChevronDown, FaChevronUp } from 'react-icons/fa';

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
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={toggleExpansion}
      >
        <div className="flex items-center">
          <FaHistory className="text-yellow-600 mr-3 text-xl" />
          <div>
            <h3 className="font-bold">Historial de viajes</h3>
            <p className="text-sm text-gray-600">{trips.length} viajes - ${totalSpent} gastados</p>
          </div>
        </div>
        {isExpanded ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-200 p-4">
          {trips.length > 0 ? (
            <div className="space-y-3">
              {trips.slice(0, 5).map((trip) => (
                <div key={trip.id} className="border-b border-gray-100 pb-2">
                  <div className="flex justify-between">
                    <div className="font-medium">{trip.destination}</div>
                    <div className="text-green-600 font-medium">${trip.price}</div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <div>{new Date(trip.date).toLocaleDateString()}</div>
                    <div className="flex items-center">
                      <FaMapMarkedAlt className="mr-1" />
                      ({trip.fromX}, {trip.fromZ}) → ({trip.toX}, {trip.toZ})
                    </div>
                  </div>
                </div>
              ))}
              
              {trips.length > 5 && (
                <div className="text-center">
                  <button className="text-yellow-600 hover:text-yellow-700 font-medium">
                    Ver más viajes
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No has realizado ningún viaje todavía</p>
          )}
        </div>
      )}
    </div>
  );
}