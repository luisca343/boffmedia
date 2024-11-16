import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2, Gift } from 'lucide-react'
import { useTranslations } from "next-intl"

interface PlayerGalleryHeaderProps {
  username: string
  cardCount: number
  editable: boolean
  hideMissingCards: boolean
  setHideMissingCards: (value: boolean) => void
  selectedEvent: string
  setSelectedEvent: (value: string) => void
  getBestPack: () => void
  bestPackLoading: boolean
  showAmounts: boolean
  setShowAmounts: (value: boolean) => void
}

export function PlayerGalleryHeader({
  username,
  cardCount,
  editable,
  hideMissingCards,
  setHideMissingCards,
  selectedEvent,
  setSelectedEvent,
  getBestPack,
  bestPackLoading,
  showAmounts,
  setShowAmounts
}: PlayerGalleryHeaderProps) {
    const trans = useTranslations('tcgpocket')
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-primary-300 text-center">
        Galería de {username}
      </h1>
      <p className="text-xl text-center text-surface-300">
        {cardCount} cartas en la colección
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
        {editable && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="hide-missing"
                checked={hideMissingCards}
                onCheckedChange={setHideMissingCards}
              />
              <Label htmlFor="hide-missing" className="text-surface-200">
                Ocultar cartas faltantes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-amounts"
                checked={showAmounts}
                onCheckedChange={setShowAmounts}
              />
              <Label htmlFor="show-amounts" className="text-surface-200">
                Mostrar cantidades
              </Label>
            </div>
          </div>
        )}
        <div className="flex items-center space-x-4">
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-[200px] bg-surface-700 text-white border-surface-600">
              <SelectValue placeholder="Seleccionar evento" />
            </SelectTrigger>
            <SelectContent className="bg-surface-700 text-white border-surface-600">
              <SelectItem value="general">Todas las cartas</SelectItem>
              <SelectItem value="mewQuest">{trans("mewQuest")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={getBestPack}
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-full shadow-md transition-all duration-300 ease-in-out transform hover:scale-105"
            disabled={bestPackLoading}
          >
            {bestPackLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}
            Recomendar Mejor Sobre
          </Button>
        </div>
      </div>
    </div>
  )
}