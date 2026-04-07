"use client"

import { useState, useRef } from "react"
import { useCameraGalleryStore, type Screenshot } from "@/stores/cameraGalleryStore"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/primitives/dialog"
import { Button } from "@/components/ui/primitives/button"
import { Input } from "@/components/ui/primitives/input"
import { ScrollArea } from "@/components/ui/primitives/scroll-area"
import { Image as ImageIcon, Upload, Send } from "lucide-react"
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-neutral-900 text-neutral-50 border-neutral-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Compartir foto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload from PC */}
          <div>
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
                    console.error("Failed to add uploaded image to gallery store", err)
                  }
                  setSelectedImage(newScreenshot)
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }
                reader.readAsDataURL(file)
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3 rounded-lg hover:bg-neutral-800 transition-colors text-left group border border-neutral-700"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                  <Upload className="h-5 w-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm text-neutral-50 group-hover:text-purple-400 transition-colors">
                    Subir desde PC
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Selecciona una imagen de tu computadora
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Gallery */}
          <div>
            <h3 className="text-sm font-medium text-neutral-400 mb-2">Galería de capturas</h3>
            <ScrollArea className="h-[300px] rounded-lg border border-neutral-800">
              {gallery.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <ImageIcon className="h-12 w-12 text-neutral-600 mb-3" />
                  <p className="text-neutral-400 text-sm">No hay imágenes en la galería</p>
                  <p className="text-neutral-500 text-xs mt-1">Toma capturas en la cámara para enviarlas</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 p-2">
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
              )}
            </ScrollArea>
          </div>

          {/* Selected Image Preview & Caption */}
          {selectedImage && (
            <div className="space-y-3 p-3 rounded-lg bg-neutral-800/50 border border-neutral-700">
              <div className="flex items-start gap-3">
                <img
                  src={selectedImage.image}
                  alt="Selected"
                  className="w-20 h-20 object-cover rounded-lg border border-neutral-700"
                />
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-neutral-400">Imagen seleccionada</p>
                  <Input
                    placeholder="Añadir comentario (opcional)..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-neutral-50"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                  />
                </div>
              </div>
              <Button
                onClick={handleSend}
                className="w-full bg-primary-400 hover:bg-primary-500 text-black"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar imagen
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
