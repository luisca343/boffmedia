"use client"

import { MapPin, Copy, Plus } from "lucide-react"
import { toast } from "react-toastify"
import { addWaypoint } from "@/services/mcef/mcefApi"
import type { Message as MessageType, WaypointMessageData } from "../../_types/Chat"

interface WaypointMessageProps {
  waypointData: WaypointMessageData
  sender: "user" | "other"
  timestamp: string
  isSender: boolean
  img: boolean
  message: MessageType
  isFirstInSequence: boolean
  isLastInSequence: boolean
}

export function WaypointMessage({
  waypointData,
  sender,
  timestamp,
  isSender,
  img,
  message,
  isFirstInSequence,
  isLastInSequence,
}: WaypointMessageProps) {
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

  function copyCoordinates() {
    const coords = `${waypointData.x} ${waypointData.y} ${waypointData.z}`
    navigator.clipboard.writeText(coords)
    toast.success("Coordenadas copiadas al portapapeles")
  }

  async function handleAddWaypoint() {
    try {
      const result = await addWaypoint({
        name: waypointData.name,
        x: waypointData.x,
        y: waypointData.y,
        z: waypointData.z,
        color: waypointData.color || '#FFFFFF'
      })

      if (result.success) {
        toast.success(`Waypoint "${waypointData.name}" añadido`)
      } else {
        toast.error(result.error || "Error al añadir waypoint")
      }
    } catch (error) {
      console.error("Failed to add waypoint:", error)
      toast.error("Error al añadir waypoint")
    }
  }

  return (
    <div className={`flex w-full ${sender === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative flex flex-col mb-0.5 min-w-16 max-w-md mx-8 ${
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
          <span className={`text-xs ${sender === "user" ? "text-ink-muted self-end" : "text-ink-muted"} mb-1`}>
            {timestamp}
          </span>
        )}
        <div
          className={`overflow-hidden border-2 border-neutral-900 bg-neutral-800 ${getBubbleShape()}`}
        >
          {/* Waypoint Info */}
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div 
                className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: waypointData.color ? `${waypointData.color}33` : '#3b82f633' }}
              >
                <MapPin className="h-6 w-6" style={{ color: waypointData.color || '#3b82f6' }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-neutral-100 mb-2">{waypointData.name}</h3>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-neutral-400">Coordenadas:</span>
                    <span className="font-mono text-neutral-200">
                      X: {waypointData.x}, Y: {waypointData.y}, Z: {waypointData.z}
                    </span>
                  </div>
                  {waypointData.dimension && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-neutral-400">Dimensión:</span>
                      <span className="text-neutral-200">{waypointData.dimension}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="px-3 py-2 border-t border-black/10 bg-neutral-850 flex items-center justify-end gap-2">
            <button
              onClick={copyCoordinates}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-700 hover:bg-neutral-600 text-neutral-100 rounded transition-colors"
            >
              <Copy className="h-3.5 w-3.5" />
              Copiar coordenadas
            </button>
            <button
              onClick={handleAddWaypoint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-hover hover:bg-primary text-black rounded transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Añadir Waypoint
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
