"use client";

import { useState } from "react";
import { useGetEvents } from "@/hooks/events/useGetEvents";
import type { Event } from "@boffmedia/shared";
import { EventHeader } from "./EventHeader";
import { EventsList } from "./EventsList";
import { EventLoadingState } from "./EventLoadingState";
import { EventErrorState } from "./EventErrorState";
import { EventCreateDialog } from "./EventCreateDialog";
import { EventEditDialog } from "./EventEditDialog";
import { EventDeleteDialog } from "./EventDeleteDialog";

export function EventsTab() {
  const { events, isLoading, error, refetch } = useGetEvents();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isOpenCreateDialog, setIsOpenCreateDialog] = useState(false);
  const [isOpenEditDialog, setIsOpenEditDialog] = useState(false);
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);

  const filteredEvents = events
    ? searchTerm
      ? events.filter(
          (event) =>
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description?.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : (events as any)
    : [];

  if (isLoading) return <EventLoadingState />;
  if (error) return <EventErrorState error={error} onRetry={refetch} />;

  return (
    <div>
      {/* Admin card */}
      <div
        className="rounded-xl overflow-hidden border mb-6"
        style={{
          background: "linear-gradient(145deg, rgba(9,13,27,0.97), rgba(15,23,42,0.95))",
          borderColor: "rgba(249,115,22,0.15)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
        }}
      >
        {/* Top neon bar */}
        <div
          className="h-[2px] w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(249,115,22,0.5), transparent)",
          }}
        />

        <EventHeader
          totalEvents={filteredEvents.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreateNew={() => setIsOpenCreateDialog(true)}
        />

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(249,115,22,0.08)" }} />

        <EventsList
          events={filteredEvents}
          onEdit={(event) => {
            setSelectedEvent(event);
            setIsOpenEditDialog(true);
          }}
          onDelete={(event) => {
            setSelectedEvent(event);
            setIsOpenDeleteDialog(true);
          }}
        />
      </div>

      {/* Dialogs */}
      <EventCreateDialog
        open={isOpenCreateDialog}
        onOpenChange={setIsOpenCreateDialog}
        onSuccess={() => { setIsOpenCreateDialog(false); refetch(); }}
      />

      {selectedEvent && (
        <>
          <EventEditDialog
            open={isOpenEditDialog}
            onOpenChange={setIsOpenEditDialog}
            event={selectedEvent}
            onSuccess={() => { setIsOpenEditDialog(false); refetch(); }}
          />
          <EventDeleteDialog
            open={isOpenDeleteDialog}
            onOpenChange={setIsOpenDeleteDialog}
            event={selectedEvent}
            onSuccess={() => { setIsOpenDeleteDialog(false); refetch(); }}
          />
        </>
      )}
    </div>
  );
}
