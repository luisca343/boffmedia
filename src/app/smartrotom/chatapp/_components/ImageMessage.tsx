import type { Message as MessageType, ImageMessageData } from "../_types/Chat"
import { MapPin, Users, ChevronDown, Download } from "lucide-react"
import { useState } from "react"
import { useCameraGalleryStore } from "@/stores/cameraGalleryStore"
import { toast } from "react-toastify"

interface ImageMessageProps {
  imageData: ImageMessageData
  sender: "user" | "other"
  timestamp: string
  isSender: boolean
  img: boolean
  message: MessageType
  isFirstInSequence: boolean
  isLastInSequence: boolean
}

export function ImageMessage({
  imageData,
  sender,
  timestamp,
  isSender,
  img,
  message,
  isFirstInSequence,
  isLastInSequence,
}: ImageMessageProps) {
  const imageUrl = imageData.imageUrl
  const meta = imageData.meta
  const caption = imageData.meta?.caption || null
  const { addScreenshot } = useCameraGalleryStore()

  const handleSaveToGallery = () => {
    try {
      addScreenshot(
        imageUrl,
        meta?.location,
        meta?.entities
      )
      toast.success("Imagen guardada en la galería")
    } catch (error) {
      console.error("Failed to save to gallery:", error)
      toast.error("Error al guardar la imagen")
    }
  }

  const getBubbleShape = () => {
    if (isSender) {
      if (isFirstInSequence && isLastInSequence) return "rounded-3xl"
      if (isLastInSequence) return "rounded-b-3xl rounded-tl-3xl rounded-tr-lg"
      if (isFirstInSequence) return "rounded-t-3xl rounded-bl-3xl rounded-br-lg"
      return "rounded-l-3xl rounded-r-lg"
    } else {
      if (isFirstInSequence && isLastInSequence) return "rounded-3xl"
      if (isLastInSequence) return "rounded-b-3xl rounded-tr-3xl rounded-tl-lg"
      if (isFirstInSequence) return "rounded-t-3xl rounded-br-3xl rounded-bl-lg"
      return "rounded-r-3xl rounded-l-lg"
    }
  }

  return (
    <div className={`flex w-full ${sender === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative flex flex-col mb-0.5 min-w-16 text-lg max-w-xl mx-8 ${
          isLastInSequence ? "mb-1" : ""
        } ${isFirstInSequence ? "mt-1" : ""}`}
      >
        {sender !== "user" && img && isLastInSequence && (
          <img
            src={`https://mc-heads.net/avatar/${message.uuid}`}
            alt={`profile picture for ${message.uuid}`}
            className="w-10 h-10 rounded-full absolute -left-6 -bottom-4"
          />
        )}
        {isFirstInSequence && (
          <span className={`text-xs ${sender === "user" ? "text-surface-400 self-end" : "text-surface-300"} mb-1`}>
            {timestamp}
          </span>
        )}
        <div
          className={`overflow-hidden  border-2 border-neutral-900 ${getBubbleShape()} ${
            sender === "user" ? "bg-primary-400" : "bg-surface-300"
          }`}
        >
          <div className="relative group">
            <img
              src={imageUrl}
              alt="Screenshot"
              className="w-full object-contain "
              style={{ maxHeight: caption && caption.length > 100 ? '300px' : '500px' }}
            />
            <button
              onClick={handleSaveToGallery}
              className="absolute top-2 right-2 p-2 bg-neutral-900/80 hover:bg-neutral-900 text-neutral-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              title="Guardar en galería"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
          {caption && (
            <div className="px-4 py-2 max-h-32 overflow-y-auto">
              <p className="break-words whitespace-pre-wrap text-neutral-800 leading-relaxed">{caption}</p>
            </div>
          )}

          {(meta?.location || (meta?.entities && meta.entities.length > 0)) && (
            <MetaDropdown meta={meta} />
          )}
        </div>
      </div>
    </div>
  )
}

function MetaDropdown({ meta }: { meta: ImageMessageData['meta'] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="px-3 py-2 border-t border-black/10 text-xs bg-transparent">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between gap-2 text-neutral-600 px-2 py-1 hover:bg-black/5 rounded"
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="font-medium">Detalles</span>
        </div>
        <div className="text-neutral-500 truncate max-w-[160px]">{meta?.id}</div>
        <ChevronDown className={`h-4 w-4 transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-2 space-y-2 text-neutral-700">
          {meta?.timestamp && (
            <div className="text-neutral-500 text-[11px]">{new Date(meta.timestamp).toLocaleString()}</div>
          )}

          {meta?.location && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-neutral-600" />
              <div className="leading-tight text-neutral-700">
                <div>
                  <span className="font-medium">Jugador:</span>{" "}
                  X: {meta.location.playerPosition.x.toFixed(1)}, Y: {meta.location.playerPosition.y.toFixed(1)}, Z: {meta.location.playerPosition.z.toFixed(1)}
                </div>
                <div className="text-neutral-600 text-[12px]">
                  <span className="font-medium">Mirando a:</span>{" "}
                  X: {meta.location.lookingAt.x.toFixed(1)}, Y: {meta.location.lookingAt.y.toFixed(1)}, Z: {meta.location.lookingAt.z.toFixed(1)}
                  {meta.location.lookingAt.block ? <span>{" — "}{meta.location.lookingAt.block}</span> : null}
                </div>
              </div>
            </div>
          )}

          {meta?.entities && meta.entities.length > 0 && (
            <div>
              <div className="text-neutral-600 font-medium text-[12px] mb-1">Entidades ({meta.entities.length})</div>
              <ul className="space-y-1">
                {meta.entities.map((e, i) => {
                  const ent: any = e
                  const isNPC = ent.type === "npc"
                  const title = isNPC ? ent.name : ent.species || ent.name || "Unknown"
                  return (
                    <li key={i} className="flex items-center justify-between text-neutral-700">
                      <div className="truncate">
                        <div className="font-medium">{title}</div>
                        <div className="text-neutral-500 text-[12px] truncate">
                          {ent.type} {ent.type === "pokemon" && ent.dex ? `• #${ent.dex}` : ""} • {ent.distance}m • {ent.coverage}%
                        </div>
                      </div>
                      <div className="ml-3 text-neutral-500 text-[12px]">
                        {`[${ent.position.x.toFixed(1)}, ${ent.position.y.toFixed(1)}, ${ent.position.z.toFixed(1)}]`}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
