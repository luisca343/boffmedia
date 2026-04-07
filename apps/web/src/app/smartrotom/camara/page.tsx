'use client'

import { useState, useEffect } from "react"
import { takeScreenshot } from "@/services/mcef/mcefApi"
import { toast } from "react-toastify"
import { useCameraGalleryStore } from "@/stores/cameraGalleryStore"
import { CameraControls } from "./_components/CameraControls"
import { CameraBottomControls } from "./_components/CameraBottomControls"
import { GalleryView } from "./_components/GalleryView"
import { ScreenshotPreviewDialog } from "./_components/ScreenshotPreviewDialog"

export default function CameraApp() {
  const [includeUI, setIncludeUI] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  
  const { gallery, addScreenshot, removeScreenshot } = useCameraGalleryStore()

  useEffect(() => {
    console.log('previewIndex changed to:', previewIndex)
    console.log('Gallery length:', gallery.length)
    console.log('Dialog should be open:', previewIndex !== null)
  }, [previewIndex, gallery.length])

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
        addScreenshot(result.image, result.location, result.entities)
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

  const handleImageClick = (index: number) => {
    console.log('handleImageClick called with index:', index)
    setPreviewIndex(index)
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    setPreviewIndex((p) => {
      if (p === null) return null
      if (direction === 'prev') {
        return (p - 1 + gallery.length) % gallery.length
      } else {
        return (p + 1) % gallery.length
      }
    })
  }

  const handleDelete = (index: number) => {
    removeScreenshot(index)
    if (gallery.length === 1) {
      setShowGallery(false)
    }
  }

  const handleDeleteFromPreview = (index: number) => {
    const wasLast = gallery.length === 1
    removeScreenshot(index)
    if (wasLast) {
      setPreviewIndex(null)
    } else if (index >= gallery.length - 1) {
      setPreviewIndex(gallery.length - 2)
    }
  }

  const handleZoomChange = (level: number) => {
    console.log('Zoom level changed to:', level)
  }

  return (
    <div className="flex flex-col h-full bg-black bg-opacity-20 text-white">
      {/* Camera View Area */}
      <div className="flex-1 relative">
        {/* Transparent background for camera view */}
        <div className="absolute inset-0 bg-transparent"></div>

        {/* Gallery view */}
        {showGallery && (
          <GalleryView
            gallery={gallery}
            onClose={() => setShowGallery(false)}
            onImageClick={handleImageClick}
            onDelete={handleDelete}
          />
        )}

        {/* Top controls */}
        <CameraControls
          includeUI={includeUI}
          onToggleUI={() => setIncludeUI(!includeUI)}
          onZoomChange={handleZoomChange}
        />
      </div>

      {/* Preview modal */}
      <ScreenshotPreviewDialog
        isOpen={previewIndex !== null}
        previewIndex={previewIndex}
        gallery={gallery}
        onClose={() => setPreviewIndex(null)}
        onNavigate={handleNavigate}
        onDelete={handleDeleteFromPreview}
      />

      {/* Bottom controls */}
      <CameraBottomControls
        galleryCount={gallery.length}
        isCapturing={isCapturing}
        onOpenGallery={() => setShowGallery(true)}
        onCapture={handleCapture}
      />
    </div>
  )
}