import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/primitives/switch"
import { Label } from "@/components/ui/primitives/label"
import { Input } from "@/components/ui/primitives/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/primitives/select"
import { Button } from "@/components/ui/primitives/button"
import { HiGift, HiClock, HiMagnifyingGlass, HiFunnel, HiSparkles } from 'react-icons/hi2'
import { Loader2 } from 'lucide-react'
import { useTranslations } from "next-intl"

interface PlayerGalleryHeaderProps {
  username: string
  cardCount: number
  editable: boolean
  hideMissingCards: boolean
  setHideMissingCards: (value: boolean) => void
  selectedEvent?: string
  setSelectedEvent?: (value: string) => void
  getBestPack?: () => void
  bestPackLoading?: boolean
  showAmounts: boolean
  setShowAmounts: (value: boolean) => void
  onRecentUpdatesClick?: () => void
  expansions: string[]
  onFilterChange: (name: string, expansion: string) => void
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
  onRecentUpdatesClick,
  expansions,
  onFilterChange
}: PlayerGalleryHeaderProps) {
  const t = useTranslations('tcgpocket')
  const [nameFilter, setNameFilter] = useState("")
  const [expansionFilter, setExpansionFilter] = useState("all")

  useEffect(() => {
    onFilterChange(nameFilter, expansionFilter === "all" ? "" : expansionFilter)
  }, [nameFilter, expansionFilter, onFilterChange])
  
  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center space-y-4">
        <div className="relative">
          {/* Background decoration */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-full"></div>
          </div>
          
          {/* Main title with gradient */}
          <h1 className="relative text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-base via-primary-hover to-base bg-clip-text text-transparent">
            {t('gallery.header.title', { username })}
          </h1>
        </div>
        
        {/* Stats card */}
        <div className="inline-flex items-center gap-3 bg-layer-3/30 border border-edge/30 rounded-full px-6 py-3 backdrop-blur-sm">
          <HiSparkles className="w-5 h-5 text-primary-hover" />
          <span className="text-lg font-medium text-ink">
            {t('gallery.header.cardCount', { count: cardCount })}
          </span>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Compact Controls */}
      <div className="bg-layer-3/50 border border-edge/50 rounded-xl p-4 space-y-4">
        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Input
              type="text"
              placeholder={t('filter.searchPlaceholder')}
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="pl-10 bg-layer-2/50 border-edge/50 text-ink hover:bg-layer-2 focus:border-primary transition-colors"
            />
            <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-muted w-4 h-4" />
          </div>
          <Select value={expansionFilter} onValueChange={setExpansionFilter}>
            <SelectTrigger className="bg-layer-2/50 border-edge/50 text-ink hover:bg-layer-2 focus:border-primary transition-colors">
              <div className="flex items-center">
                <HiFunnel className="w-4 h-4 mr-2 text-ink-muted" />
                <SelectValue placeholder={t('filter.expansionPlaceholder')} />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-layer-3/95 border-edge/50 backdrop-blur-sm">
              <SelectItem value="all" className="text-ink hover:bg-layer-3/50">
                {t('filter.allExpansions')}
              </SelectItem>
              {expansions.map((expansion) => (
                <SelectItem 
                  key={expansion} 
                  value={expansion}
                  className="text-ink hover:bg-layer-3/50"
                >
                  {expansion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Options & Actions Row - Only show if there are options or actions to display */}
        {(editable || (selectedEvent && setSelectedEvent && getBestPack && onRecentUpdatesClick)) && (
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Toggle Options - Only for editable galleries */}
            {editable && (
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="hide-missing"
                    checked={hideMissingCards}
                    onCheckedChange={setHideMissingCards}
                  />
                  <Label htmlFor="hide-missing" className="text-ink text-sm cursor-pointer">
                    {t('gallery.options.hideMissing')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-amounts"
                    checked={showAmounts}
                    onCheckedChange={setShowAmounts}
                  />
                  <Label htmlFor="show-amounts" className="text-ink text-sm cursor-pointer">
                    {t('gallery.options.showAmounts')}
                  </Label>
                </div>
              </div>
            )}
            
            {/* Action Buttons - Only for editable galleries */}
            {editable && selectedEvent && setSelectedEvent && getBestPack && onRecentUpdatesClick && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger className="w-full sm:w-[200px] bg-layer-2/50 border-edge/50 text-ink hover:bg-layer-2 transition-colors">
                    <SelectValue placeholder={t('gallery.options.selectEvent')} />
                  </SelectTrigger>
                  <SelectContent className="bg-layer-3/95 border-edge/50 backdrop-blur-sm">
                    <SelectItem value="general" className="text-ink hover:bg-layer-3/50">
                      {t('gallery.options.allCards')}
                    </SelectItem>
                    <SelectItem value="expansion:geneticapex" className="text-ink hover:bg-layer-3/50">
                      {t("geneticapex")}
                    </SelectItem>
                    <SelectItem value="expansion:mythicalisland" className="text-ink hover:bg-layer-3/50">
                      {t("mythicalisland")}
                    </SelectItem>
                    <SelectItem value="event:mewQuest" className="text-ink hover:bg-layer-3/50">
                      {t("mewQuest")}
                    </SelectItem>
                    <SelectItem value="expansion:space-timesmackdown" className="text-ink hover:bg-layer-3/50">
                      {t("space-timesmackdown")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  onClick={getBestPack}
                  disabled={bestPackLoading}
                >
                  {bestPackLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <HiGift className="mr-2 h-4 w-4" />
                  )}
                  {t('gallery.options.bestPack')}
                </Button>
                
                <Button
                  onClick={onRecentUpdatesClick}
                  variant="outline"
                >
                  <HiClock className="mr-2 h-4 w-4" />
                  {t('gallery.recentCards')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}