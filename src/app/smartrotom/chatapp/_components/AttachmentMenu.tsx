"use client"

import { useState } from "react"
import { Paperclip, Image as ImageIcon, FileText, MapPin, X } from "lucide-react"
import { Button } from "@/components/ui/primitives/button"
import { ImageGalleryPicker } from "./ImageGalleryPicker"
import { WaypointPicker } from "./WaypointPicker"

interface AttachmentMenuProps {
  onSendImage: (screenshot: any, caption?: string) => void
  onSendWaypoint: (waypoint: { name: string; x: number; y: number; z: number; dimension?: string; color?: string }) => void
}

export function AttachmentMenu({ onSendImage, onSendWaypoint }: AttachmentMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [waypointOpen, setWaypointOpen] = useState(false)

  const attachmentOptions = [
    {
      icon: ImageIcon,
      label: "Fotos y videos",
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      onClick: () => {
        setGalleryOpen(true)
        setIsOpen(false)
      }
    },
    {
      icon: FileText,
      label: "Documento",
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      onClick: () => {
        // TODO: Implement document picker
        console.log("Document picker")
        setIsOpen(false)
      }
    },
    {
      icon: MapPin,
      label: "Ubicación",
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      onClick: () => {
        setWaypointOpen(true)
        setIsOpen(false)
      }
    }
  ]

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="text-neutral-400 hover:text-neutral-50"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Paperclip className="h-5 w-5" />}
        </Button>

        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 bg-neutral-800 rounded-2xl shadow-lg border border-neutral-700 p-2 min-w-[200px] animate-in fade-in slide-in-from-bottom-2 duration-200">
            {attachmentOptions.map((option, index) => (
              <button
                key={index}
                onClick={option.onClick}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-neutral-700 transition-colors group"
              >
                <div className={`${option.bgColor} p-2 rounded-full`}>
                  <option.icon className={`h-5 w-5 ${option.color}`} />
                </div>
                <span className="text-sm text-neutral-200 group-hover:text-neutral-50">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <ImageGalleryPicker
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        onSendImage={onSendImage}
      />

      <WaypointPicker
        open={waypointOpen}
        onOpenChange={setWaypointOpen}
        onWaypointSelect={(waypoint) => {
          onSendWaypoint(waypoint)
          setWaypointOpen(false)
        }}
      />
    </>
  )
}
