"use client";

import { Package, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RewardSpinProps {
  progress?: number;  // 0-100
}

export default function RewardSpin({ progress = 25 }: RewardSpinProps) {
  return (
    <div className="bg-gray-900 border-4 border-gray-800 rounded-xl overflow-hidden shadow-2xl relative">
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 py-2 px-4 border-b-2 border-gray-600">
        <h3 className="text-md font-bold text-gray-300 uppercase tracking-wide text-center">
          Giro de Recompensa
        </h3>
      </div>
      
      <div className="bg-gray-950 p-4 flex flex-col items-center gap-3">
        <div className="text-center mb-2">
          <p className="text-gray-400 text-sm">Juega más para desbloquear</p>
          <p className="text-blue-300 font-bold">Recompensas Premium</p>
        </div>
        
        <div className="relative w-full aspect-square max-w-[220px] bg-gray-850 rounded-lg border-2 border-gray-700 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-blue-900/30 rounded-md flex items-center justify-center border-4 border-blue-500/20 shadow-lg shadow-blue-500/20">
              <Package className="h-16 w-16 text-blue-400" />
            </div>
          </div>
          
          {/* Locked overlay */}
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-red-500 font-bold text-xl transform rotate-12 border-2 border-red-500 px-4 py-1 rounded-md">
              BLOQUEADO
            </div>
          </div>
        </div>
        
        <Button
          disabled={true}
          className="w-full mt-4 bg-gray-700 text-gray-400 py-3 text-lg font-bold rounded-md uppercase tracking-wider cursor-not-allowed"
        >
          Juega Más Partidas
        </Button>
      </div>
      
      {/* Progress bar */}
      <div className="bg-gray-800 p-2 border-t-2 border-gray-700">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-yellow-500" />
          <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 to-amber-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}