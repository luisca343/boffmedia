import { Camera, X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/primitives/button"
import { useEffect } from "react"
import type { Screenshot } from "@/stores/cameraGalleryStore"

interface GalleryViewProps {
  gallery: Screenshot[]
  onClose: () => void
  onImageClick: (index: number) => void
  onDelete: (index: number) => void
}

export function GalleryView({ gallery, onClose, onImageClick, onDelete }: GalleryViewProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className="absolute inset-0 bg-black z-10 flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-black/80 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-semibold">Gallery</h2>
          <p className="text-sm text-gray-400">
            {gallery.length} {gallery.length === 1 ? 'photo' : 'photos'}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onClose}
          className="hover:bg-white/10"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {gallery.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Camera className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg">No screenshots yet</p>
            <p className="text-sm">Take a photo to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {gallery.map((screenshot, idx) => (
              <div 
                key={screenshot.id}
                className="relative group aspect-video bg-gray-900 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => {
                    console.log('Gallery item clicked, index:', idx)
                    onImageClick(idx)
                  }}
                  className="w-full h-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <img 
                    src={screenshot.image} 
                    alt={`Screenshot ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('Delete this screenshot?')) {
                      onDelete(idx)
                    }
                  }}
                  className="absolute top-2 right-2 p-2 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-2 text-xs bg-black/60 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  #{idx + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
