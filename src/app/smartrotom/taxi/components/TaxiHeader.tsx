import { FaTaxi, FaUserCircle, FaCoins, FaHistory } from 'react-icons/fa'
import { formatMoney } from '../../starbank/bankUtils';

interface Position {
  x: number;
  z: number;
}

interface TaxiHeaderProps {
  playerPosition: Position;
  playerMoney: number;
  onHistoryClick?: () => void;
}

export default function TaxiHeader({ playerPosition, playerMoney, onHistoryClick }: TaxiHeaderProps) {
  return (
    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-800 to-blue-900 p-4 shadow-md z-10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <div className="bg-yellow-400 p-2 rounded-full mr-3 shadow-[0_0_12px_rgba(250,204,21,0.4)]">
            <FaTaxi className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-white">Taxi de Teras</h1>
        </div>
        
        <div className="flex items-center space-x-3">

          <div className="flex items-center bg-blue-700/60 px-3 py-1 rounded-full border border-blue-500/30">
            <FaUserCircle className="text-blue-300 mr-2" />
            <span className="text-white font-medium">
              {playerPosition.x}, {playerPosition.z}
            </span>
          </div>
          
          <div className="flex items-center bg-blue-700/60 px-3 py-1 rounded-full border border-blue-500/30">
            <FaCoins className="text-yellow-400 mr-2" />
            <span className="text-white font-medium">{formatMoney(playerMoney)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}