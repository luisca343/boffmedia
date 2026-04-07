import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/primitives/button"
import { useEffect, useState } from "react"
import { setZoomLevel, getZoomLevel } from "@/services/mcef/mcefApi"

interface CameraZoomSliderProps {
  onZoomChange?: (level: number) => void
}

// Zoom level presets matching Java: 0 = no zoom, 1 = 1.5x, 2 = 2x, 3 = 3x, 4 = 4x
// Multipliers: [1.0, 0.67, 0.5, 0.33, 0.25]
const ZOOM_LEVELS = [
  { level: 0, label: "1x", multiplier: 1.0 },
  { level: 1, label: "1.5x", multiplier: 0.67 },
  { level: 2, label: "2x", multiplier: 0.5 },
  { level: 3, label: "3x", multiplier: 0.33 },
  { level: 4, label: "4x", multiplier: 0.25 },
]

export function CameraZoomSlider({ onZoomChange }: CameraZoomSliderProps) {
  const [zoomLevel, setZoomLevelState] = useState(2) // Default to 2x zoom
  const [isLoading, setIsLoading] = useState(false)

  // Load initial zoom level from Minecraft
  useEffect(() => {
    const loadZoomLevel = async () => {
      const result = await getZoomLevel()
      if (result.success && result.level !== undefined) {
        setZoomLevelState(result.level)
      }
    }
    loadZoomLevel()
  }, [])

  const handleZoomChange = async (newLevel: number) => {
    if (isLoading) return
    
    setIsLoading(true)
    setZoomLevelState(newLevel)
    
    // Update Minecraft zoom
    await setZoomLevel(newLevel)
    
    onZoomChange?.(newLevel)
    setIsLoading(false)
  }

  const increaseZoom = () => {
    if (zoomLevel < ZOOM_LEVELS.length - 1) {
      handleZoomChange(zoomLevel + 1)
    }
  }

  const decreaseZoom = () => {
    if (zoomLevel > 0) {
      handleZoomChange(zoomLevel - 1)
    }
  }

  const currentZoom = ZOOM_LEVELS[zoomLevel]

  return (
    <div className="flex items-center gap-2 bg-black/50 rounded-full px-3 py-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full hover:bg-white/10"
        onClick={decreaseZoom}
        disabled={zoomLevel === 0 || isLoading}
      >
        <Minus className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2 min-w-[120px] justify-center">
        {/* Zoom dots indicator */}
        <div className="flex gap-1">
          {ZOOM_LEVELS.map((zoom, idx) => (
            <button
              key={zoom.level}
              className={`h-2 w-2 rounded-full transition-all ${
                idx === zoomLevel
                  ? 'bg-white scale-125'
                  : idx < zoomLevel
                  ? 'bg-white/60'
                  : 'bg-white/20'
              }`}
              onClick={() => handleZoomChange(zoom.level)}
              disabled={isLoading}
              aria-label={`Set zoom to ${zoom.label}`}
            />
          ))}
        </div>

        {/* Zoom level text */}
        <span className="text-sm font-medium text-white min-w-[32px] text-center">
          {currentZoom.label}
        </span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full hover:bg-white/10"
        onClick={increaseZoom}
        disabled={zoomLevel === ZOOM_LEVELS.length - 1 || isLoading}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
