"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/primitives/dialog"
import { toast } from "react-toastify"
import { GameForm, type GameFormValues } from "./GameForm"
import type { Game } from "@/types/events"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { useTranslations } from "next-intl"

interface GameEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  game: Game
  onSuccess: () => void
}

export function GameEditDialog({ open, onOpenChange, game, onSuccess }: GameEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const t = useTranslations('boffmedia')

  const handleSubmit = async (data: GameFormValues) => {
    setIsSubmitting(true)
    try {
      await EventsService.updateGame(game.id!, {
        ...game,
        ...data,
      })
      toast.success(t('admin.games.edit.success', { title: data.title }))
      onSuccess()
    } catch (error) {
      toast.error(t('admin.games.edit.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-800 border-surface-700 text-surface-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('admin.games.edit.title')}</DialogTitle>
          <DialogDescription className="text-surface-300">
            {t('admin.games.edit.description')}
          </DialogDescription>
        </DialogHeader>

        <GameForm
          defaultValues={game}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitLabel={isSubmitting ? t('admin.games.edit.updating') : t('admin.games.edit.saveButton')}
        />
      </DialogContent>
    </Dialog>
  )
}

