import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProbabilityTable } from "./ProbabilityTable"
import { useTranslations } from "next-intl"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
      <DialogContent className="bg-surface-800 text-white border-surface-700 max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary-300">
            {t('bestPack.dialogTitle')}
          </DialogTitle>
          <DialogDescription className="text-surface-300">
            {type === "general" ? (
              bestPackData && t('bestPack.bestPackGeneral', {
                packName: t(`packs.${bestPackData?.bestPack?.name?.toLowerCase()}`)
              })
            ) : (
              eventPackData && (
                <>
                  <p>{t('bestPack.bestPackEvent', {
                    eventName: t(eventName),
                    packName: t(`packs.${eventPackData?.bestPack?.name?.toLowerCase()}`)
                  })}</p>
                  <p className="mt-2">
                    {t('bestPack.missingCardsCount', {
                      missing: eventPackData?.missingEventCards?.length,
                      total: eventPackData?.totalEventCards
                    })}
                  </p>
                  <p className="mt-2 text-sm">{t('bestPack.missingCardsList')}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {eventPackData?.missingEventCards?.map((pokemon: string, index: number) => {
                      const packs = getPokemonPacks(pokemon);
                      return (
                        <TooltipProvider key={index}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className={`inline-block text-xs font-medium rounded-full cursor-help hover:text-primary-400 ${packs.length > 1 ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'}`}>
                                {pokemon}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {packs.length > 1 ? (
                                <div>
                                  <p className="font-bold mb-1">{t('bestPack.availableIn')}</p>
                                  <ul className="list-disc pl-4">
                                    {packs.map((pack, i) => (
                                      <li key={i}>{pack}</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <p>{packs[0]}</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                </>
              )
            )}
          </DialogDescription>
        </DialogHeader>
        {type === "general" ? (
          bestPackData && <ProbabilityTable probabilities={bestPackData.allPackProbabilities} />
        ) : (
          eventPackData && <ProbabilityTable probabilities={eventPackData.allPackProbabilities} />
        )}
      </DialogContent>
    </Dialog>
  )
}