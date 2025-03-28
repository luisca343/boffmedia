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
import { Loader2, Gift, Clock } from 'lucide-react'
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
  onRecentUpdatesClick: () => void
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
  setShowAmounts,
  onRecentUpdatesClick
}: PlayerGalleryHeaderProps) {
  const t = useTranslations('tools.tcgpocket')
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-300">
          {t('gallery.header.title', { username })}
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-surface-300 mt-2">
          {t('gallery.header.cardCount', { count: cardCount })}
        </p>
      </div>
      <div className="flex flex-col lg:flex-row lg:justify-between space-y-4">
        {editable && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="hide-missing"
                checked={hideMissingCards}
                onCheckedChange={setHideMissingCards}
              />
              <Label htmlFor="hide-missing" className="text-surface-200">
                {t('gallery.options.hideMissing')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-amounts"
                checked={showAmounts}
                onCheckedChange={setShowAmounts}
              />
              <Label htmlFor="show-amounts" className="text-surface-200">
                {t('gallery.options.showAmounts')}
              </Label>
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-full sm:w-[200px] bg-surface-700 text-white border-surface-600">
              <SelectValue placeholder={t('gallery.options.selectEvent')} />
            </SelectTrigger>
            <SelectContent className="bg-surface-700 text-white border-surface-600">
              <SelectItem value="general">{t('gallery.options.allCards')}</SelectItem>
              <SelectItem value="expansion:geneticapex">{t("geneticapex")}</SelectItem>
              <SelectItem value="expansion:mythicalisland">{t("mythicalisland")}</SelectItem>
              <SelectItem value="event:mewQuest">{t("mewQuest")}</SelectItem>
              <SelectItem value="expansion:space-timesmackdown">{t("space-timesmackdown")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={getBestPack}
            className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-full shadow-md transition-all duration-300 ease-in-out transform hover:scale-105"
            disabled={bestPackLoading}
          >
            {bestPackLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}
            {t('gallery.options.bestPack')}
          </Button>
          <Button
            onClick={onRecentUpdatesClick}
            className="w-full sm:w-auto bg-surface-700 hover:bg-surface-600 text-white font-semibold py-2 px-4 rounded-full shadow-md transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            <Clock className="mr-2 h-4 w-4" />
            {t('gallery.recentCards')}
          </Button>
        </div>
      </div>
    </div>
  )
}