"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/primitives/dialog"
import { Button } from "@/components/ui/primitives/button"
import { toast } from "react-toastify"
import { Calendar, RefreshCw } from "lucide-react"
import type { Event } from "@/types/events"
import { useTranslations } from "next-intl"

interface EventDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Event
  onSuccess: () => void
}

export function EventDeleteDialog({ open, onOpenChange, event, onSuccess }: EventDeleteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const t = useTranslations('boffmedia')

  const handleDelete = async () => {
    setIsSubmitting(true)
    try {
      //await eventsService.deleteEvent(event.id)
      toast.success(t('admin.events.delete.success', { title: event.title }))
      onSuccess()
    } catch (error) {
      toast.error(t('admin.events.delete.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-800 border-surface-700 text-surface-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('admin.events.delete.title')}</DialogTitle>
          <DialogDescription className="text-surface-300">
            {t('admin.events.delete.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-3 p-4 bg-surface-700/50 rounded-lg mb-4">
            <div className="w-12 h-12 rounded bg-surface-600 flex items-center justify-center overflow-hidden">
              {event.icon ? (
                <img src={event.icon || "/placeholder.svg"} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <Calendar className="h-6 w-6 text-surface-500" />
              )}
            </div>
            <div>
              <h4 className="font-medium text-surface-50">{event.title}</h4>
              <p className="text-sm text-surface-300">ID: {event.id}</p>
            </div>
          </div>

          <p className="text-warning-500 text-sm">
            {t('admin.events.delete.warning')}
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-surface-600 text-surface-300"
          >
            {t('admin.events.delete.cancel')}
          </Button>
          <Button
            type="button"
            variant="error"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="ml-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {t('admin.events.delete.deleting')}
              </>
            ) : (
              t('admin.events.delete.deleteButton')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

