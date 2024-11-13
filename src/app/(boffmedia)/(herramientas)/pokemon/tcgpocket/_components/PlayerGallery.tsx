"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Minus, Save, Gift } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useTranslations } from "next-intl"
import { toast } from 'react-toastify'
import { boffPOST } from "@/services/boffAPI"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import PercentageToDecimal from "./PercentageToDecimal"

interface Card {
  expansion: string
  number: number
  name: string
  count: number
}

interface PlayerGalleryProps {
  username: string
  allCards: Card[]
  userCards: Record<string, number>
  loading: boolean
  editable: boolean
  onAddCard?: (card: Card) => void
  onRemoveCard?: (card: Card) => void
  onSaveChanges?: () => void
}

interface PackProbabilities {
  newCardProbabilities: number[]
  aggregateProbability: number
}

function ProbabilityTable({ probabilities }: { probabilities: Record<string, PackProbabilities> }) {
  const trans = useTranslations('tcgpocket')


  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-white">Sobre</TableHead>
          <TableHead className="text-white">Cartas 1-3</TableHead>
          <TableHead className="text-white">Carta 4</TableHead>
          <TableHead className="text-white">Carta 5</TableHead>
          <TableHead className="text-white">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(probabilities).map(([packName, probs]) => (
          <TableRow key={packName}>
            <TableCell className="text-white">{trans(`packs.${packName}`)}</TableCell>
            <TableCell className="text-white">
                <PercentageToDecimal num={probs.newCardProbabilities[0] * 100} fixed={3} />
              </TableCell>
              <TableCell className="text-white">
                <PercentageToDecimal num={probs.newCardProbabilities[3] * 100} fixed={3} />
              </TableCell>
              <TableCell className="text-white">
                <PercentageToDecimal num={probs.newCardProbabilities[4] * 100} fixed={3} />
              </TableCell>
              <TableCell className="text-white">
                <PercentageToDecimal num={probs.aggregateProbability * 100} fixed={3} />
              </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function PlayerGallery({
  username,
  allCards,
  userCards,
  loading,
  editable,
  onAddCard,
  onRemoveCard,
  onSaveChanges
}: PlayerGalleryProps) {
  const [hideMissingCards, setHideMissingCards] = useState(false)
  const [changes, setChanges] = useState<Record<string, number>>({})
  const [cardCount, setCardCount] = useState(0)
  const [bestPackLoading, setBestPackLoading] = useState(false)
  const [bestPackData, setBestPackData] = useState<{ bestPack: any, probabilities: PackProbabilities, allPackProbabilities: Record<string, PackProbabilities> } | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<string>("general")
  const [eventPackData, setEventPackData] = useState<{ bestPack: any, probabilities: PackProbabilities, allPackProbabilities: Record<string, PackProbabilities>, missingEventCards: string[] , totalEventCards: number } | null>(null)
  const trans = useTranslations('tcgpocket')

  useEffect(() => {
    const count = Object.values(userCards).reduce((acc, curr) => acc + curr, 0)
    setCardCount(count)
  }, [userCards])

  const handleAddCard = (card: Card) => {
    if (editable && onAddCard) {
      onAddCard(card)
      const key = `${card.expansion}_${card.number}`
      setChanges(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }))
    }
  }

  const handleRemoveCard = (card: Card) => {
    if (editable && onRemoveCard) {
      onRemoveCard(card)
      const key = `${card.expansion}_${card.number}`
      const currentCount = userCards[key] || 0
      const changeCount = changes[key] || 0
      if (currentCount + changeCount > 0) {
        setChanges(prev => ({ ...prev, [key]: (prev[key] || 0) - 1 }))
      }
    }
  }

  const getBestPack = async () => {
    setBestPackLoading(true)
    try {
      if (selectedEvent === "general") {
        const result = await boffPOST('/herramientas/ptcgp/best-pack', { username })
        if (result.message) {
          toast.info(result.message)
        } else {
          setBestPackData(result)
          setEventPackData(null)
          setIsDialogOpen(true)
        }
      } else {
        const result = await boffPOST('/herramientas/ptcgp/best-pack-for-event', { username, eventName: selectedEvent })
        if (result.message) {
          toast.info(result.message)
        } else {
          setEventPackData(result)
          setBestPackData(null)
          setIsDialogOpen(true)
        }
      }
    } catch (error) {
      console.error('Error getting best pack:', error)
      toast.error('No se pudo obtener el mejor pack. Por favor, intenta de nuevo.')
    } finally {
      setBestPackLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-orange-300 text-center">
        Galería de {username} ({cardCount} cartas)
      </h1>
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 space-y-4 sm:space-y-0">
        {editable && (
          <div className="flex items-center">
            <Label htmlFor="hide-missing" className="mr-2 text-white">
              Ocultar cartas faltantes
            </Label>
            <Switch
              id="hide-missing"
              checked={hideMissingCards}
              onCheckedChange={setHideMissingCards}
            />
          </div>
        )}
        <div className="flex items-center space-x-4">
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-[200px] bg-primary-700 text-white border-primary-600">
              <SelectValue placeholder="Seleccionar evento" />
            </SelectTrigger>
            <SelectContent className="bg-primary-700 text-white border-primary-600">
              <SelectItem value="general">Todas las cartas</SelectItem>
              <SelectItem value="mewQuest">Mew Quest</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={getBestPack}
                className="bg-purple-500 hover:bg-purple-600"
                disabled={bestPackLoading}
              >
                {bestPackLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}
                Recomendar Mejor Sobre
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-primary-800 text-white border-primary-700 max-w-4xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-orange-300">Probabilidades de Nuevas Cartas por Pack</DialogTitle>
                <DialogDescription className="text-main-300">
                  {selectedEvent === "general" ? (
                    `El mejor pack para obtener nuevas cartas es: ${bestPackData?.bestPack.name}`
                  ) : (
                    <>
                      <p>El mejor pack para obtener nuevas cartas del evento {selectedEvent} es: {eventPackData?.bestPack.name}</p>
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
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : allCards.length === 0 ? (
        <p className="text-center text-main-300">No se encontraron cartas.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          <AnimatePresence>
            {allCards.map((card) => {
              const key = `${card.expansion}_${card.number}`
              const count = (userCards[key] || 0) + (changes[key] || 0)
              const isMissing = count === 0

              if (hideMissingCards && isMissing) {
                return null
              }

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="group block">
                    <div className={`relative bg-primary-800/50 backdrop-blur-sm rounded-xl p-3 transition-all duration-300 hover:bg-primary-700/50 hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl ${isMissing ? 'grayscale' : ''}`}>
                      <div className="aspect-[2.5/3.5] relative">
                        <Image
                          src={`/img/tcgpocket/cards/${card.expansion}/${card.number}.jpg`}
                          alt={card.name}
                          layout="fill"
                          objectFit="contain"
                          className="rounded-lg transition-transform duration-300"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                          priority
                        />
                      </div>
                      <div className="mt-2">
                        <h3 className="text-sm text-white text-center truncate font-medium">
                          {card.name}
                        </h3>
                        <p className="text-xs text-main-400 text-center">{trans(card.expansion)}</p>
                        {editable && (
                          <div className="flex justify-between items-center mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveCard(card)}
                              className="p-1 opacity-100 group-hover:opacity-100 transition-opacity"
                              disabled={loading || count === 0}
                            >
                              <Minus className="h-4 w-4 text-black" />
                            </Button>
                            <span className="text-white font-bold">
                              {count}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddCard(card)}
                              className="p-1 opacity-100 group-hover:opacity-100 transition-opacity"
                              disabled={loading}
                            >
                              <Plus className="h-4 w-4 text-black" />
                            </Button>
                          </div>
                        )}
                        {!editable && (
                          <div className="mt-2">
                            <span className="text-white font-bold">
                              {count}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
      {editable && Object.keys(changes).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4"
        >
          <Button onClick={onSaveChanges} className="bg-orange-500 hover:bg-orange-600" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Cambios
          </Button>
        </motion.div>
      )}
    </div>
  )
}