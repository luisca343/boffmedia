import { Camera, FlipHorizontal, Flashlight, Image } from "lucide-react"
import { Button } from "@/components/ui/primitives/button"

export default function CameraApp() {
  return (
    <div className="flex flex-col h-full bg-black bg-opacity-20 text-white">
      {/* Camera View Area */}
      <div className="flex-1 relative">
        {/* Transparent background for camera view */}
        <div className="absolute inset-0 bg-transparent"></div>
        
        {/* Top controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <Button variant="ghost" size="icon" className="rounded-full bg-black/50">
            <Flashlight className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-black/50">
            <FlipHorizontal className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="h-24 bg-black flex items-center justify-between px-8">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Image className="h-8 w-8" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full border-4 border-white p-1">
          <div className="bg-white rounded-full h-16 w-16"></div>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Camera className="h-8 w-8" />
        </Button>
      </div>
    </div>
  )
}