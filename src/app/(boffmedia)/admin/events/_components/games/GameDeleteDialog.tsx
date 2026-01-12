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
import { Gamepad, RefreshCw } from "lucide-react"
import type { Game } from "@/types/events"
import { useTranslations } from "next-intl"

interface GameDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  game: Game
  onSuccess: () => void
}

export function GameDeleteDialog({ open, onOpenChange, game, onSuccess }: GameDeleteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const t = useTranslations('boffmedia')

  const handleDelete = async () => {
    setIsSubmitting(true)
    try {
      // await eventsService.deleteGame(game.id)
      toast.success(t('admin.games.delete.success', { title: game.title }))
      onSuccess()
    } catch (error) {
      toast.error(t('admin.games.delete.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-800 border-surface-700 text-surface-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('admin.games.delete.title')}</DialogTitle>
          <DialogDescription className="text-surface-300">
            {t('admin.games.delete.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-3 p-4 bg-surface-700/50 rounded-lg mb-4">
            <div className="w-12 h-12 rounded bg-surface-600 flex items-center justify-center overflow-hidden">
              {game.icon ? (
                <img src={game.icon || "/placeholder.svg"} alt={game.title} className="w-full h-full object-cover" />
              ) : (
                <Gamepad className="h-6 w-6 text-surface-500" />
              )}
            </div>
            <div>
              <h4 className="font-medium text-surface-50">{game.title}</h4>
              <p className="text-sm text-surface-300">ID: {game.id}</p>
            </div>
          </div>

          <p className="text-warning-500 text-sm">
            {t('admin.games.delete.warning')}
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-surface-600 text-surface-300"
          >
            {t('admin.games.delete.cancel')}
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
                {t('admin.games.delete.deleting')}
              </>
            ) : (
              t('admin.games.delete.deleteButton')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

