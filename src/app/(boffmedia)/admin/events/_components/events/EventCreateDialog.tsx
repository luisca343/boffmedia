"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/primitives/dialog"
import { toast } from "react-toastify"
import { EventForm, type EventFormValues } from "./EventForm"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { useTranslations } from "next-intl"

interface EventCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EventCreateDialog({ open, onOpenChange, onSuccess }: EventCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const t = useTranslations('boffmedia')

  const handleSubmit = async (data: EventFormValues) => {
      setIsSubmitting(true)
      try {
        const { gameId, ...rest } = data;
        const eventData = {
          ...rest,
          gameId,
          icon: data.icon || '',  // Provide a default value as it's required
          banner: data.banner || '',  // Provide a default value as it's required
          endDate: data.endDate || data.startDate,  // Provide a default value as it's required
        };
        
      
      await (await EventsService.createEvent(eventData)).data
      toast.success(t('admin.events.create.success', { title: data.title }))
      onSuccess()
    } catch (error) {
      toast.error(t('admin.events.create.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-800 border-surface-700 text-surface-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('admin.events.create.title')}</DialogTitle>
          <DialogDescription className="text-surface-300">
            {t('admin.events.create.description')}
          </DialogDescription>
        </DialogHeader>

        <EventForm
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitLabel={isSubmitting ? t('admin.events.create.creating') : t('admin.events.create.createButton')}
        />
      </DialogContent>
    </Dialog>
  )
}

