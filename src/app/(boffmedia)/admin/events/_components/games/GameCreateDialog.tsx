"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/primitives/dialog"
import { toast } from "react-toastify"
import { GameForm, type GameFormValues } from "./GameForm"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { useTranslations } from "next-intl"

interface GameCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function GameCreateDialog({ open, onOpenChange, onSuccess }: any) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const t = useTranslations('boffmedia')

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      await (await EventsService.createGame(data!)).data
      toast.success(t('admin.games.create.success', { title: data.title }))
      onSuccess()
    } catch (error) {
      toast.error(t('admin.games.create.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-800 border-surface-700 text-surface-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('admin.games.create.title')}</DialogTitle>
          <DialogDescription className="text-surface-300">
            {t('admin.games.create.description')}
          </DialogDescription>
        </DialogHeader>

        <GameForm
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitLabel={isSubmitting ? t('admin.games.create.creating') : t('admin.games.create.createButton')}
        />
      </DialogContent>
    </Dialog>
  )
}

