import { PanelsTopLeft } from "lucide-react"
import { Button } from "@/components/ui/primitives/button"
import { CameraZoomSlider } from "./CameraZoomSlider"
import { CameraFlashlightButton } from "./CameraFlashlightButton"

interface CameraControlsProps {
  includeUI: boolean
  onToggleUI: () => void
  onZoomChange?: (level: number) => void
}

export function CameraControls({ includeUI, onToggleUI, onZoomChange }: CameraControlsProps) {
  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full ${includeUI ? 'bg-white/50' : 'bg-black/50'}`}
          onClick={onToggleUI}
          title={includeUI ? 'Hide UI' : 'Show UI'}
        >
          <PanelsTopLeft className="h-6 w-6" />
        </Button>

        <CameraFlashlightButton />
      </div>

      <CameraZoomSlider onZoomChange={onZoomChange} />
      
      <div className="text-sm bg-black/50 px-3 py-1 rounded-full">
        {includeUI ? 'UI: ON' : 'UI: OFF'}
      </div>
    </div>
  )
}
