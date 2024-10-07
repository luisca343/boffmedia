import { Coins } from 'lucide-react'

interface ScoreboardProps {
  roundScore: number
  totalCoins: number
  level: number
}

export default function Scoreboard({ roundScore, totalCoins, level }: ScoreboardProps) {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-white">Nivel:</span>
        <span className="text-white font-bold">{level}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-white">Puntuación:</span>
        <span className="text-white font-bold">{roundScore}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-white">Total monedas:</span>
        <div className="flex items-center">
          <Coins className="w-5 h-5 text-yellow-500 mr-1" />
          <span className="text-white font-bold">{totalCoins}</span>
        </div>
      </div>
    </div>
  )
}