"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Minus, Save } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useTranslations } from "next-intl"

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
  const trans = useTranslations('tcgpocket')

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-orange-300 text-center">
        Galería de {username}
      </h1>
      {editable && (
        <div className="flex items-center justify-end mb-4">
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
      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : allCards.length === 0 ? (
        <p className="text-center text-gray-300">No se encontraron cartas.</p>
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
                    <div className={`relative bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 transition-all duration-300 hover:bg-slate-700/50 hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl ${isMissing ? 'grayscale' : ''}`}>
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
                        <p className="text-xs text-gray-400 text-center">{trans(card.expansion)}</p>
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