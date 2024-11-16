import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog"
  import { ProbabilityTable } from "./ProbabilityTable"
import { useTranslations } from "next-intl"
  
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
                  <p className="mt-2 text-sm">Lista de cartas faltantes: {eventPackData?.missingEventCards.join(', ')}</p>
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