"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "react-toastify"
import { EventForm, type EventFormValues } from "./EventForm"
import { EventsService } from "@/services/api/boffmedia/eventsService"

interface EventCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EventCreateDialog({ open, onOpenChange, onSuccess }: EventCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  

  const handleSubmit = async (data: EventFormValues) => {
      setIsSubmitting(true)
      try {
        const { gameId, ...rest } = data;
        const eventData = {
          ...rest,
          gameId,
          icon: data.icon || '',  // Provide a default value as it's required
          endDate: data.endDate || data.startDate,  // Provide a default value as it's required
        };
        
      
      await (await EventsService.createEvent(eventData)).data
      toast.success(`El evento "${data.title}" ha sido creado con éxito.`)
      onSuccess()
    } catch (error) {
      toast.error("Ocurrió un error al intentar crear el evento.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-800 border-surface-700 text-surface-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Crear Nuevo Evento</DialogTitle>
          <DialogDescription className="text-surface-300">
            Completa el formulario para añadir un nuevo evento al sistema.
          </DialogDescription>
        </DialogHeader>

        <EventForm
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitLabel={isSubmitting ? "Creando..." : "Crear Evento"}
        />
      </DialogContent>
    </Dialog>
  )
}

