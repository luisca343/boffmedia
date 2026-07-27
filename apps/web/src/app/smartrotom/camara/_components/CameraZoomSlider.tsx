import { Minus, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/primitives/button"
import { useEffect, useRef, useState } from "react"
import { setZoomLevel, getZoomLevel, subscribeZoomChanged } from "@/services/mcef/mcefApi"

// The level is the contract with the mod; the factor beside it is only the readout to
// show before the mod answers. The mod's own factor replaces it as soon as it arrives.
const ZOOM_LEVELS = [
  { level: 0, factor: 1 },
  { level: 1, factor: 1.5 },
  { level: 2, factor: 2 },
  { level: 3, factor: 3 },
  { level: 4, factor: 4 },
]

const DEFAULT_LEVEL = 2

const formatFactor = (factor: number) => `${Number(factor.toFixed(2))}x`

interface CameraZoomSliderProps {
  onZoomChange?: (level: number) => void
}

export function CameraZoomSlider({ onZoomChange }: CameraZoomSliderProps) {
  const t = useTranslations("camara")
  const [zoomLevel, setZoomLevelState] = useState(DEFAULT_LEVEL)
  const [factor, setFactor] = useState(ZOOM_LEVELS[DEFAULT_LEVEL].factor)
  const [isLoading, setIsLoading] = useState(false)

  const onZoomChangeRef = useRef(onZoomChange)
  onZoomChangeRef.current = onZoomChange

  const applyLevel = (level: number, factor?: number) => {
    setZoomLevelState(level)
    setFactor(factor ?? ZOOM_LEVELS[level]?.factor ?? 1)
  }

  useEffect(() => {
    const loadZoomLevel = async () => {
      const result = await getZoomLevel()
      if (result.success && result.level !== undefined) {
        applyLevel(result.level, result.factor)
      }
    }
    loadZoomLevel()
  }, [])

  // `+`/`-` in-game are a second source of truth; without this the readout drifts from the
  // viewfinder the first time the player uses them. A set from this page pushes nothing,
  // so there's no echo to guard against.
  useEffect(() => {
    return subscribeZoomChanged(({ level, factor }) => {
      applyLevel(level, factor)
      onZoomChangeRef.current?.(level)
    })
  }, [])

  const handleZoomChange = async (newLevel: number) => {
    if (isLoading) return

    setIsLoading(true)
    applyLevel(newLevel)

    // Update Minecraft zoom
    const result = await setZoomLevel(newLevel)
    if (result.success && result.level !== undefined) {
      applyLevel(result.level, result.factor)
    }

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

  return (
    <div className="flex items-center gap-2 bg-black/50 rounded-full px-3 py-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full hover:bg-white/10"
        onClick={decreaseZoom}
        aria-label={t("zoom.decrease")}
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
              aria-label={t("zoom.setZoom", { factor: formatFactor(zoom.factor) })}
            />
          ))}
        </div>

        {/* Zoom level text */}
        <span className="text-sm font-medium text-white min-w-[32px] text-center">
          {formatFactor(factor)}
        </span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full hover:bg-white/10"
        onClick={increaseZoom}
        aria-label={t("zoom.increase")}
        disabled={zoomLevel === ZOOM_LEVELS.length - 1 || isLoading}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
