import { Flashlight } from "lucide-react"
import { Button } from "@/components/ui/primitives/button"
import { CameraZoomSlider } from "./CameraZoomSlider"

interface CameraControlsProps {
  includeUI: boolean
  onToggleUI: () => void
  onZoomChange?: (level: number) => void
}

export function CameraControls({ includeUI, onToggleUI, onZoomChange }: CameraControlsProps) {
  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
      <Button 
        variant="ghost" 
        size="icon" 
        className={`rounded-full ${includeUI ? 'bg-white/50' : 'bg-black/50'}`}
        onClick={onToggleUI}
        title={includeUI ? 'Hide UI' : 'Show UI'}
      >
        <Flashlight className="h-6 w-6" />
      </Button>
      
      <CameraZoomSlider onZoomChange={onZoomChange} />
      
      <div className="text-sm bg-black/50 px-3 py-1 rounded-full">
        {includeUI ? 'UI: ON' : 'UI: OFF'}
      </div>
    </div>
  )
}
