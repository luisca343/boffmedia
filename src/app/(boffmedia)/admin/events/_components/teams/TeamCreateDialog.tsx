"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/primitives/dialog"
import { toast } from "react-toastify"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { TeamForm, type TeamFormValues } from "./TeamForm"
import { useTranslations } from "next-intl"

interface TeamCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function TeamCreateDialog({ open, onOpenChange, onSuccess }: TeamCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const t = useTranslations('boffmedia')

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      await (await EventsService.createTeam(data.eventId, data!)).data
      toast.success(t('admin.teams.create.success', { name: data.name }))
      onSuccess()
    } catch (error) {
      toast.error(t('admin.teams.create.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-800 border-surface-700 text-surface-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('admin.teams.create.title')}</DialogTitle>
          <DialogDescription className="text-surface-300">
            {t('admin.teams.create.description')}
          </DialogDescription>
        </DialogHeader>

        <TeamForm
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitLabel={isSubmitting ? t('admin.teams.create.creating') : t('admin.teams.create.createButton')}
        />
      </DialogContent>
    </Dialog>
  )
}

