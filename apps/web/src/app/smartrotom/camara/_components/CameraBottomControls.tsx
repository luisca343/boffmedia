import { Camera, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/primitives/button"

interface CameraBottomControlsProps {
  galleryCount: number
  isCapturing: boolean
  onOpenGallery: () => void
  onCapture: () => void
}

export function CameraBottomControls({ 
  galleryCount, 
  isCapturing, 
  onOpenGallery, 
  onCapture 
}: CameraBottomControlsProps) {
  return (
    <div className="h-24 bg-black flex items-center justify-between px-8">
      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-full"
        onClick={onOpenGallery}
        disabled={galleryCount === 0}
      >
        <ImageIcon className="h-8 w-8" aria-hidden="true" />
        {galleryCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {galleryCount}
          </span>
        )}
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-full border-4 border-white p-1"
        onClick={onCapture}
        disabled={isCapturing}
      >
        <div className={`bg-white rounded-full h-16 w-16 ${isCapturing ? 'animate-pulse' : ''}`}></div>
      </Button>
      <Button variant="ghost" size="icon" className="rounded-full opacity-0 pointer-events-none">
        <Camera className="h-8 w-8" />
      </Button>
    </div>
  )
}
