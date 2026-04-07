"use client"

import { useState, useEffect } from "react"
import { MapPin, Loader2, Navigation } from "lucide-react"
import { Button } from "@/components/ui/primitives/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/primitives/dialog"
import { ScrollArea } from "@/components/ui/primitives/scroll-area"
import { getWaypoints, getMcUserData, type Waypoint } from "@/services/mcef/mcefApi"

interface WaypointPickerProps {
  onWaypointSelect: (waypoint: { name: string; x: number; y: number; z: number; dimension?: string; color?: string }) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function WaypointPicker({ onWaypointSelect, open: externalOpen, onOpenChange }: WaypointPickerProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const [waypoints, setWaypoints] = useState<Waypoint[]>([])
  const [loading, setLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ x: number; y: number; z: number; world: string } | null>(null)

  useEffect(() => {
    if (open) {
      loadWaypoints()
      loadCurrentLocation()
    }
  }, [open])

  async function loadWaypoints() {
    setLoading(true)
    try {
      const result = await getWaypoints()
      if (result.success && result.waypoints) {
        setWaypoints(result.waypoints)
      }
    } catch (error) {
      console.error("Failed to load waypoints:", error)
    } finally {
      setLoading(false)
    }
  }

  async function loadCurrentLocation() {
    try {
      const result = await getMcUserData()
      if (result.data) {
        setCurrentLocation({
          x: Math.floor(result.data.x),
          y: Math.floor(result.data.y),
          z: Math.floor(result.data.z),
          world: result.data.world
        })
      }
    } catch (error) {
      console.error("Failed to load current location:", error)
    }
  }

  function handleSelectCurrentLocation() {
    if (currentLocation) {
      onWaypointSelect({
        name: "Ubicación actual",
        x: currentLocation.x,
        y: currentLocation.y,
        z: currentLocation.z,
        dimension: currentLocation.world
      })
      setOpen(false)
    }
  }

  function handleSelectWaypoint(waypoint: Waypoint) {
    onWaypointSelect(waypoint)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] bg-neutral-900 text-neutral-50 border-neutral-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Compartir ubicación
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Location */}
          {currentLocation && (
            <div className="border border-neutral-800 rounded-lg p-3 bg-neutral-850">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-400/20 flex items-center justify-center flex-shrink-0">
                    <Navigation className="h-5 w-5 text-primary-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-neutral-100 mb-1">Ubicación actual</h4>
                    <p className="text-sm text-neutral-400">
                      X: {currentLocation.x}, Y: {currentLocation.y}, Z: {currentLocation.z}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">{currentLocation.world}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleSelectCurrentLocation}
                  className="bg-primary-400 hover:bg-primary-500 text-black"
                >
                  Enviar
                </Button>
              </div>
            </div>
          )}

          {/* Waypoints List */}
          <div>
            <h4 className="text-sm font-medium text-neutral-400 mb-2 px-1">Waypoints guardados</h4>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
              </div>
            ) : waypoints.length > 0 ? (
              <ScrollArea className="h-[300px] rounded-md border border-neutral-800">
                <div className="p-2 space-y-1">
                  {waypoints.map((waypoint, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectWaypoint(waypoint)}
                      className="flex items-center justify-between p-3 rounded-md hover:bg-neutral-800 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
                          style={{ backgroundColor: waypoint.color || '#888888' }}
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-neutral-100 truncate">{waypoint.name}</h5>
                          <p className="text-sm text-neutral-400">
                            X: {waypoint.x}, Y: {waypoint.y}, Z: {waypoint.z}
                          </p>
                          {waypoint.dimension && (
                            <p className="text-xs text-neutral-500 mt-0.5">{waypoint.dimension}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectWaypoint(waypoint)
                        }}
                      >
                        Enviar
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-neutral-500 border border-neutral-800 rounded-md">
                <MapPin className="h-10 w-10 mb-2" />
                <p className="text-sm">No hay waypoints guardados</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
