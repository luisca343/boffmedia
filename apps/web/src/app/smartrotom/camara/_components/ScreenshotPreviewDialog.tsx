import { ChevronLeft, ChevronRight, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/primitives/button"
import { Dialog, DialogContent } from "@/components/ui/primitives/dialog"
import { toast } from "react-toastify"
import type { Screenshot } from "@/stores/cameraGalleryStore"
import { ScreenshotMetadata } from "./ScreenshotMetadata"

interface ScreenshotPreviewDialogProps {
  isOpen: boolean
  previewIndex: number | null
  gallery: Screenshot[]
  onClose: () => void
  onNavigate: (direction: 'prev' | 'next') => void
  onDelete: (index: number) => void
}

export function ScreenshotPreviewDialog({
  isOpen,
  previewIndex,
  gallery,
  onClose,
  onNavigate,
  onDelete
}: ScreenshotPreviewDialogProps) {

  if (previewIndex === null || !gallery[previewIndex]) {
    return null
  }

  const screenshot = gallery[previewIndex]

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = screenshot.image
    link.download = `minecraft-screenshot-${screenshot.timestamp}.png`
    link.click()
    toast.success('Screenshot downloaded')
  }

  const handleDelete = () => {
    if (confirm('Delete this screenshot?')) {
      const wasLast = gallery.length === 1
      onDelete(previewIndex)
      if (wasLast) {
        onClose()
      }
      toast.success('Screenshot deleted')
    }
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 border-gray-700 bg-gray-900">
        <div className="w-full h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-black/50 shrink-0">
            <div className="text-sm text-gray-300 font-medium">
              {previewIndex + 1} / {gallery.length}
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Image area */}
            <div className="flex-1 relative flex items-center justify-center p-6 bg-black">
              {gallery.length > 1 && (
                <>
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
                    onClick={() => onNavigate('prev')}
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>

                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
                    onClick={() => onNavigate('next')}
                    aria-label="Next"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              <img
                src={screenshot.image}
                alt="Screenshot preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Metadata sidebar */}
            <ScreenshotMetadata screenshot={screenshot} />
          </div>

          {/* Footer actions */}
          <div className="p-3 border-t border-gray-700 bg-black/50 backdrop-blur-sm flex items-center justify-end gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="hover:bg-white/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="hover:bg-red-500/10 text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
