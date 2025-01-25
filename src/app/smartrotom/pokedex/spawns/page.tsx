"use client"
import { PossibleSpawns } from "../_components/PossibleSpawns"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

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
    <div className="bg-surface-800 p-4">
      <div className="flex gap-4 flex-row">
        <div className="flex items-center space-x-2">
          <Switch id="show-seen" checked={showSeen} onCheckedChange={setShowSeen} />
          <Label htmlFor="show-seen" className="text-surface-50 text-lg">
            Avistados
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="show-caught" checked={showCaught} onCheckedChange={setShowCaught} />
          <Label htmlFor="show-caught" className="text-surface-50 text-lg">
            Atrapados
          </Label>
        </div>
      </div>
      <PossibleSpawns hideCaught={!showCaught} hideSeen={!showSeen} />
    </div>
  )
}

