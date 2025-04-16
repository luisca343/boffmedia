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
    <div className="absolute top-0 left-0 right-0 bg-blue-500 p-4 shadow-md z-10 flex justify-between items-center">
      <div className="flex items-center">
        <FaTaxi className="text-white text-3xl mr-2" />
        <h1 className="text-2xl font-bold text-white">Taxi de Teras</h1>
      </div>
      <div className="flex items-center space-x-3">
        <div className="flex items-center bg-blue-600 px-3 py-1 rounded-full">
          <FaUserCircle className="text-white mr-2" />
          <span className="text-white font-semibold">
            {playerPosition.x}, {playerPosition.z}
          </span>
        </div>
        <div className="flex items-center bg-blue-600 px-3 py-1 rounded-full">
          <FaCoins className="text-white mr-2" />
          <span className="text-white font-semibold">{formatMoney(playerMoney)}</span>
        </div>
      </div>
    </div>
  )
}