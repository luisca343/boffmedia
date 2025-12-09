"use client"

import { useState, useRef } from "react"
import { useCameraGalleryStore, type Screenshot } from "@/stores/cameraGalleryStore"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/primitives/dialog"
import { Button } from "@/components/ui/primitives/button"
import { Input } from "@/components/ui/primitives/input"
import { ScrollArea } from "@/components/ui/primitives/scroll-area"
import { X, Send } from "lucide-react"
import { strToDate } from "@/lib/utils"

interface ImageGalleryPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSendImage: (screenshot: Screenshot, caption?: string) => void
}

export function ImageGalleryPicker({ open, onOpenChange, onSendImage }: ImageGalleryPickerProps) {
  const { gallery, addScreenshot } = useCameraGalleryStore()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedImage, setSelectedImage] = useState<Screenshot | null>(null)
  const [caption, setCaption] = useState("")

  const handleSend = () => {
    if (selectedImage) {
      onSendImage(selectedImage, caption.trim() || undefined)
      setSelectedImage(null)
      setCaption("")
      onOpenChange(false)
    }
  }

  const handleClose = () => {
    setSelectedImage(null)
    setCaption("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-neutral-900 text-neutral-50 border-neutral-800">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Seleccionar imagen de la galería</span>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="mb-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = () => {
                const dataUrl = reader.result as string
                const newScreenshot: Screenshot = {
                  id: `screenshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  image: dataUrl,
                  timestamp: Date.now(),
                  location: undefined,
                  entities: undefined,
                }
                try {
                  addScreenshot(dataUrl)
                } catch (err) {
                  // non-fatal if store fails
                  console.error("Failed to add uploaded image to gallery store", err)
                }
                setSelectedImage(newScreenshot)
                // clear the input so the same file can be re-selected later
                if (fileInputRef.current) fileInputRef.current.value = ""
              }
              reader.readAsDataURL(file)
            }}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="border-neutral-700"
            >
              Subir imagen desde PC
            </Button>
          </div>
        </div>

        {gallery.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <p>No hay imágenes en la galería</p>
            <p className="text-sm mt-2">Toma capturas en la cámara para enviarlas</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[300px] pr-4">
              <div className="grid grid-cols-3 gap-3">
                {gallery.map((screenshot) => (
                  <button
                    key={screenshot.id}
                    onClick={() => setSelectedImage(screenshot)}
                    className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage?.id === screenshot.id
                        ? "border-primary-400 ring-2 ring-primary-400"
                        : "border-neutral-700 hover:border-neutral-500"
                    }`}
                  >
                    <img
                      src={screenshot.image}
                      alt={`Screenshot ${screenshot.id}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      {strToDate(new Date(screenshot.timestamp).toISOString())}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>

            {selectedImage && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <img
                    src={selectedImage.image}
                    alt="Selected"
                    className="w-16 h-16 object-cover rounded border border-neutral-700"
                  />
                  <Input
                    placeholder="Añadir un comentario (opcional)..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="flex-1 bg-neutral-800 border-neutral-700 focus-visible:ring-primary/50"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="border-neutral-700">
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={!selectedImage}
            className="bg-primary-400 hover:bg-primary-500 text-black"
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
