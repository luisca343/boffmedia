import { FaTaxi, FaUserCircle, FaCoins } from 'react-icons/fa'

interface Position {
  x: number;
  z: number;
}

interface TaxiHeaderProps {
  playerPosition: Position;
  playerMoney: number;
}

export default function TaxiHeader({ playerPosition, playerMoney }: TaxiHeaderProps) {
  return (
    <div className="absolute top-0 left-0 right-0 bg-yellow-500 p-4 shadow-md z-10 flex justify-between items-center">
      <div className="flex items-center">
        <FaTaxi className="text-white text-3xl mr-2" />
        <h1 className="text-2xl font-bold text-white">Taxi de Teras</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center bg-yellow-600 px-3 py-1 rounded-full">
          <FaUserCircle className="text-white mr-2" />
          <span className="text-white font-semibold">
            {playerPosition.x}, {playerPosition.z}
          </span>
        </div>
        <div className="flex items-center bg-yellow-600 px-3 py-1 rounded-full">
          <FaCoins className="text-white mr-2" />
          <span className="text-white font-semibold">${playerMoney}</span>
        </div>
      </div>
    </div>
  )
}