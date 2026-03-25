"use client"
import { PossibleSpawns } from "../_components/PossibleSpawns"
import { useState } from "react"
import { Label } from "@/components/ui/primitives/label"
import { Switch } from "@/components/ui/primitives/switch"
import { 
  AdjustmentsHorizontalIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  InformationCircleIcon 
} from "@heroicons/react/24/outline"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/primitives/tooltip"

type PossibleSpawn = {
  dex: number
  species: string
  form: string
  palette: string
  rarity: number
  percentage: number
}

export default function Spawns() {
  const [showCaught, setShowCaught] = useState(true)
  const [showSeen, setShowSeen] = useState(true)

  return (
    <div className="bg-surface-800 min-h-full overflow-auto">
      <div className="mt-4 p-4 max-w-7xl mx-auto">
        <div className="flex flex-col space-y-4">
          <div className="bg-surface-700/30 rounded-lg p-4 border border-surface-600/50">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-surface-50">Posibles Spawns</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InformationCircleIcon className="h-5 w-5 text-surface-400" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="text-sm">Pokémon que pueden aparecer en el mundo ahora mismo</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-center space-x-1">
                <AdjustmentsHorizontalIcon className="h-5 w-5 text-primary-300 mr-1" />
                <span className="text-sm text-primary-300">Filtros</span>
              </div>
            </div>
            
            <div className="bg-surface-800/50 rounded-lg p-3 mb-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="show-seen" 
                    checked={showSeen} 
                    onCheckedChange={setShowSeen}
                  />
                  <Label htmlFor="show-seen" className="text-surface-50 flex items-center">
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Avistados
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="show-caught" 
                    checked={showCaught} 
                    onCheckedChange={setShowCaught} 
                  />
                  <Label htmlFor="show-caught" className="text-surface-50 flex items-center">
                    <img 
                      src="/smartrotom/img/apps/pokedex/capturado.webp" 
                      alt="Capturado" 
                      className="h-4 w-4 mr-1" 
                    />
                    Atrapados
                  </Label>
                </div>
              </div>
              <div className="mt-2 text-xs text-surface-400 italic">
                {!showCaught && !showSeen ? 
                  "Mostrando todos los Pokémon" : 
                  `${!showCaught || !showSeen ? 'Ocultando Pokémon' : ''} ${!showCaught ? "atrapados" : ""}${!showCaught && !showSeen ? " y " : ""}${!showSeen ? "avistados" : ""}`
                }
              </div>
            </div>
            
            <div className="bg-surface-700/20 rounded-lg p-3 border border-surface-600/30">
              <PossibleSpawns hideCaught={!showCaught} hideSeen={!showSeen} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}