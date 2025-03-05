"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { useGetEvents } from "@/hooks/events/useGetEvents"
import type { Event } from "@/types/events"
import { EventHeader } from "./EventHeader"
import { EventsList } from "./EventsList"
import { EventLoadingState } from "./EventLoadingState"
import { EventErrorState } from "./EventErrorState"
import { EventCreateDialog } from "./EventCreateDialog"
import { EventEditDialog } from "./EventEditDialog"
import { EventDeleteDialog } from "./EventDeleteDialog"

export function EventsTab() {
  const { events, isLoading, error, refetch } = useGetEvents()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isOpenCreateDialog, setIsOpenCreateDialog] = useState(false)
  const [isOpenEditDialog, setIsOpenEditDialog] = useState(false)
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false)

  const filteredEvents = events
    ? searchTerm
      ? events.filter(
          (event) =>
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : events
    : []

  const handleCreateSuccess = () => {
    setIsOpenCreateDialog(false)
    refetch()
  }

  const handleEditSuccess = () => {
    setIsOpenEditDialog(false)
    refetch()
  }

  const handleDeleteSuccess = () => {
    setIsOpenDeleteDialog(false)
    refetch()
  }

  if (isLoading) return <EventLoadingState />
  if (error) return <EventErrorState error={error} onRetry={refetch} />

  return (
    <div>
      <Card className="bg-surface-800 border-surface-700 mb-6">
        <EventHeader
          totalEvents={filteredEvents.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreateNew={() => setIsOpenCreateDialog(true)}
        />

        <EventsList
          events={filteredEvents}
          onEdit={(event) => {
            setSelectedEvent(event)
            setIsOpenEditDialog(true)
          }}
          onDelete={(event) => {
            setSelectedEvent(event)
            setIsOpenDeleteDialog(true)
          }}
        />
      </Card>

      <EventCreateDialog
        open={isOpenCreateDialog}
        onOpenChange={setIsOpenCreateDialog}
        onSuccess={handleCreateSuccess}
      />

      {selectedEvent && (
        <>
          <EventEditDialog
            open={isOpenEditDialog}
            onOpenChange={setIsOpenEditDialog}
            event={selectedEvent}
            onSuccess={handleEditSuccess}
          />

          <EventDeleteDialog
            open={isOpenDeleteDialog}
            onOpenChange={setIsOpenDeleteDialog}
            event={selectedEvent}
            onSuccess={handleDeleteSuccess}
          />
        </>
      )}
    </div>
  )
}

