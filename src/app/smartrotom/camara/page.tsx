'use client'

import { Camera, FlipHorizontal, Flashlight, Image, X, ChevronLeft, ChevronRight, Trash2, Download } from "lucide-react"
import { Button } from "@/components/ui/primitives/button"
import { useState, useEffect } from "react"
import { takeScreenshot } from "@/services/mcef/mcefApi"
import { toast } from "react-toastify"
import { useCameraGalleryStore } from "@/stores/cameraGalleryStore"

export default function CameraApp() {
  const [includeUI, setIncludeUI] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  
  const { gallery, addScreenshot, removeScreenshot } = useCameraGalleryStore()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') return setPreviewIndex(null)
      if (previewIndex === null) return
      if (e.key === 'ArrowLeft') {
        setPreviewIndex((p) => {
          if (p === null) return null
          const prev = (p - 1 + gallery.length) % gallery.length
          return prev
        })
      }
      if (e.key === 'ArrowRight') {
        setPreviewIndex((p) => {
          if (p === null) return null
          const next = (p + 1) % gallery.length
          return next
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gallery.length, previewIndex])

  const handleCapture = async () => {
    setIsCapturing(true)
    try {
      const result = await takeScreenshot({
        includeUI,
        format: 'png',
        quality: 90
      })

      if (result.success && result.image) {
        addScreenshot(result.image)
        toast.success('Screenshot saved to gallery')
      } else {
        toast.error(result.error || 'Failed to capture screenshot')
      }
    } catch (error) {
      toast.error('Error capturing screenshot')
      console.error('Screenshot error:', error)
    } finally {
      setIsCapturing(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-black bg-opacity-20 text-white">
      {/* Camera View Area */}
      <div className="flex-1 relative">
        {/* Transparent background for camera view */}
        <div className="absolute inset-0 bg-transparent"></div>
        
        {/* Preview removed: screenshots go directly to gallery */}

        {/* Gallery view */}
        {showGallery && (
          <div className="absolute inset-0 bg-black z-10 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-black/80 backdrop-blur-sm">
              <div>
                <h2 className="text-xl font-semibold">Gallery</h2>
                <p className="text-sm text-gray-400">{gallery.length} {gallery.length === 1 ? 'photo' : 'photos'}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowGallery(false)}
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
                  {gallery.map((img, idx) => (
                    <div 
                      key={idx}
                      className="relative group aspect-video bg-gray-900 rounded-lg overflow-hidden"
                    >
                      <img 
                        src={img} 
                        alt={`Screenshot ${idx + 1}`}
                        className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                        onClick={() => {
                          setPreviewIndex(idx)
                          setShowGallery(false)
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('Delete this screenshot?')) {
                            removeScreenshot(idx)
                            if (gallery.length === 1) {
                              setShowGallery(false)
                            }
                          }
                        }}
                        className="absolute top-2 right-2 p-2 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 text-xs bg-black/60 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        #{idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Top controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`rounded-full ${includeUI ? 'bg-white/50' : 'bg-black/50'}`}
            onClick={() => setIncludeUI(!includeUI)}
            title={includeUI ? 'Hide UI' : 'Show UI'}
          >
            <Flashlight className="h-6 w-6" />
          </Button>
          <div className="text-sm bg-black/50 px-3 py-1 rounded-full">
            {includeUI ? 'UI: ON' : 'UI: OFF'}
          </div>
        </div>
      </div>

      {/* Preview modal (centered, dismissible) */}
      {previewIndex !== null && gallery[previewIndex] && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setPreviewIndex(null)}
          />

          <div className="relative max-w-[90%] max-h-[90%] w-full bg-black rounded-lg overflow-hidden shadow-2xl border border-gray-800">
            <button
              className="absolute top-3 right-3 z-40 p-2 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
              onClick={() => setPreviewIndex(null)}
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>

            {gallery.length > 1 && (
              <>
                <button
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors disabled:opacity-30"
                  onClick={() => setPreviewIndex((p) => (p === null ? null : (p - 1 + gallery.length) % gallery.length))}
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>

                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors disabled:opacity-30"
                  onClick={() => setPreviewIndex((p) => (p === null ? null : (p + 1) % gallery.length))}
                  aria-label="Next"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <div className="flex items-center justify-center p-6">
              <img
                src={gallery[previewIndex]}
                alt="Screenshot preview"
                className="max-w-full max-h-[75vh] object-contain rounded"
              />
            </div>

            <div className="p-4 border-t border-gray-800 bg-black/50 backdrop-blur-sm flex items-center justify-between">
              <div className="text-sm text-gray-300 font-medium">
                {previewIndex + 1} / {gallery.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = gallery[previewIndex]
                    link.download = `minecraft-screenshot-${Date.now()}.png`
                    link.click()
                    toast.success('Screenshot downloaded')
                  }}
                  className="hover:bg-white/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Delete this screenshot?')) {
                      const wasLast = gallery.length === 1
                      removeScreenshot(previewIndex)
                      if (wasLast) {
                        setPreviewIndex(null)
                      } else if (previewIndex >= gallery.length - 1) {
                        setPreviewIndex(gallery.length - 2)
                      }
                      toast.success('Screenshot deleted')
                    }
                  }}
                  className="hover:bg-red-500/10 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="h-24 bg-black flex items-center justify-between px-8">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          onClick={() => setShowGallery(true)}
          disabled={gallery.length === 0}
        >
          <Image className="h-8 w-8"/>
          {gallery.length > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {gallery.length}
            </span>
          )}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full border-4 border-white p-1"
          onClick={handleCapture}
          disabled={isCapturing}
        >
          <div className={`bg-white rounded-full h-16 w-16 ${isCapturing ? 'animate-pulse' : ''}`}></div>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full opacity-0 pointer-events-none">
          <Camera className="h-8 w-8" />
        </Button>
      </div>
    </div>
  )
}