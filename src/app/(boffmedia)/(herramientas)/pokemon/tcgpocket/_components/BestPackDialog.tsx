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
  const trans = useTranslations('tcgpocket')

  const getPokemonPacks = (pokemonName: string) => {
    const packs = Object.entries(selectedEvent === "general" ? bestPackData.allPackProbabilities : eventPackData.allPackProbabilities)
      .filter(([_, packData]) => (packData as { availableCards: string[] }).availableCards.includes(pokemonName))
      .map(([packName, _]) => trans(`packs.${packName}`));
    return packs.join(", ");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-800 text-white border-surface-700 max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary-300">Probabilidades de Nuevas Cartas por Pack</DialogTitle>
          <DialogDescription className="text-surface-300">
            {selectedEvent === "general" ? (
              `El mejor sobre para obtener nuevas cartas es: ${bestPackData?.bestPack.name}`
            ) : (
              <>
                <p>El mejor sobre para obtener nuevas cartas del evento &apos;{trans(selectedEvent)}&apos; es: {eventPackData?.bestPack.name}</p>
                <p className="mt-2">Cartas faltantes del evento: {eventPackData?.missingEventCards.length} de {eventPackData?.totalEventCards}</p>
                <p className="mt-2 text-sm">Lista de cartas faltantes:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {eventPackData?.missingEventCards.map((pokemon: string, index: number) => (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-block text-xs font-medium bg-primary text-primary-foreground rounded-full cursor-help">
                            {pokemon}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Encontrado en: {getPokemonPacks(pokemon)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        {selectedEvent === "general" ? (
          bestPackData && <ProbabilityTable probabilities={bestPackData.allPackProbabilities} />
        ) : (
          eventPackData && <ProbabilityTable probabilities={eventPackData.allPackProbabilities} />
        )}
      </DialogContent>
    </Dialog>
  )
}

