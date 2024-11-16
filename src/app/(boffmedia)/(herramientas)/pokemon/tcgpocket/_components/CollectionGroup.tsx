import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { CardItem } from './CardItem'
import { Card } from '../types'

interface CollectionGroupProps {
  expansion: string
  cards: Card[]
  userCards: Record<string, number>
  changes: Record<string, number>
  hideMissingCards: boolean
  editable: boolean
  loading: boolean
  handleAddCard: (card: Card) => void
  handleRemoveCard: (card: Card) => void
  trans: (key: string) => string
}

export function CollectionGroup({
  expansion,
  cards,
  userCards,
  changes,
  hideMissingCards,
  editable,
  loading,
  handleAddCard,
  handleRemoveCard,
  trans
}: CollectionGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const toggleExpansion = () => setIsExpanded(!isExpanded)

  const getCardCounts = () => {
    const totalCards = cards.length;
    const currentCards = cards.reduce((count, card) => {
      const key = `${card.expansion}_${card.number}`;
      const cardCount = (userCards[key] || 0) + (changes[key] || 0);
      return count + (cardCount > 0 ? 1 : 0);
    }, 0);
    return { currentCards, totalCards };
  };

  return (
    <div className="mb-8">
      <button
        onClick={toggleExpansion}
        className="w-full flex items-center justify-between p-4 bg-surface-700 rounded-t-lg text-left text-lg font-semibold text-white hover:bg-surface-600 transition-colors duration-200"
      >
        <span>
          {trans(expansion)} ({getCardCounts().currentCards} / {getCardCounts().totalCards})
        </span>
        {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 p-4 bg-surface-800 rounded-b-lg">
              {cards.map((card) => {
                const key = `${card.expansion}_${card.number}`
                const count = (userCards[key] || 0) + (changes[key] || 0)
                const isMissing = count === 0

                if (hideMissingCards && isMissing) {
                  return null
                }

                return (
                  <CardItem
                    key={key}
                    card={card}
                    count={count}
                    isMissing={isMissing}
                    editable={editable}
                    loading={loading}
                    handleAddCard={handleAddCard}
                    handleRemoveCard={handleRemoveCard}
                    trans={trans}
                  />
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}