import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/primitives/dialog"
import { ProbabilityTable } from "./ProbabilityTable"
import { useTranslations } from "next-intl"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/primitives/tooltip"
import { TrophyIcon } from "@heroicons/react/24/outline"

interface BestPackDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedEvent: string
  bestPackData: any
  eventPackData: any
}

export function BestPackDialog({
  isOpen,
  onOpenChange,
  selectedEvent,
  bestPackData,
  eventPackData
}: BestPackDialogProps) {
  const t = useTranslations('tcgpocket')

  const [type, eventName] = selectedEvent.split(':') || ['general', 'general'];
  
  const getPokemonPacks = (pokemonName: string): string[] => {
    const packs = Object.entries(type === "general" ? bestPackData?.allPackProbabilities : eventPackData?.allPackProbabilities)
      .filter(([_, packData]) => (packData as { availableCards: string[] })?.availableCards?.includes(pokemonName))
      .map(([packName, _]) => t(`packs.${packName}`));
    return packs;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-800 border border-surface-600/50 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-surface-700/50 border border-surface-600/50">
              <TrophyIcon className="w-5 h-5 text-primary-400" />
            </div>
            <DialogTitle className="text-xl font-semibold text-surface-50">
              {t('bestPack.dialogTitle')}
            </DialogTitle>
          </div>
          
          <div className="bg-surface-700/30 border border-surface-600/30 rounded-lg p-4">
            <DialogDescription className="text-surface-300 space-y-2">
              {type === "general" ? (
                bestPackData && (
                  <p className="text-primary-300 font-medium">
                    {t('bestPack.bestPackGeneral', {
                      packName: t(`packs.${bestPackData?.bestPack?.name?.toLowerCase()}`)
                    })}
                  </p>
                )
              ) : (
                eventPackData && (
                  <div className="space-y-3">
                    <p className="text-primary-300 font-medium">
                      {t('bestPack.bestPackEvent', {
                        eventName: t(eventName),
                        packName: t(`packs.${eventPackData?.bestPack?.name?.toLowerCase()}`)
                      })}
                    </p>
                    <p className="text-surface-400">
                      {t('bestPack.missingCardsCount', {
                        missing: eventPackData?.missingEventCards?.length,
                        total: eventPackData?.totalEventCards
                      })}
                    </p>
                    
                    {eventPackData?.missingEventCards?.length > 0 && (
                      <div>
                        <p className="text-sm text-surface-400 mb-2">{t('bestPack.missingCardsList')}</p>
                        <div className="flex flex-wrap gap-2">
                          {eventPackData?.missingEventCards?.map((pokemon: string, index: number) => {
                            const packs = getPokemonPacks(pokemon);
                            return (
                              <TooltipProvider key={index}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className={`
                                      inline-block px-2 py-1 text-xs font-medium rounded-full cursor-help transition-colors
                                      ${packs.length > 1 
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20' 
                                        : 'bg-primary-500/10 text-primary-400 border border-primary-500/20 hover:bg-primary-500/20'
                                      }
                                    `}>
                                      {pokemon}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-surface-700 border-surface-600">
                                    {packs.length > 1 ? (
                                      <div>
                                        <p className="font-bold mb-1 text-surface-50">{t('bestPack.availableIn')}</p>
                                        <ul className="list-disc pl-4 space-y-1">
                                          {packs.map((pack, i) => (
                                            <li key={i} className="text-surface-300">{pack}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    ) : (
                                      <p className="text-surface-300">{packs[0]}</p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          {type === "general" ? (
            bestPackData && <ProbabilityTable probabilities={bestPackData.allPackProbabilities} />
          ) : (
            eventPackData && <ProbabilityTable probabilities={eventPackData.allPackProbabilities} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}