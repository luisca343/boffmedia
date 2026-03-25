import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { CardItem } from './CardItem'
import { TcgCard } from '@boffmedia/shared'

interface CollectionGroupProps {
  expansion: string
  cards: TcgCard[]
  userCards: Record<string, number>
  changes: Record<string, number>
  hideMissingCards: boolean
  editable: boolean
  loading: boolean
  handleAddCard: (card: TcgCard) => void
  handleRemoveCard: (card: TcgCard) => void
  trans: (key: string) => string
  showAmounts: boolean
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
  trans,
  showAmounts
}: CollectionGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const toggleExpansion = () => setIsExpanded(!isExpanded)

  const getCardCounts = () => {
    const totalCards = cards.length;
    const currentCards = cards.reduce((count, card) => {
      const key = card.id;
      const cardCount = (userCards[key] || 0) + (changes[key] || 0);
      return count + (cardCount > 0 ? 1 : 0);
    }, 0);
    return { currentCards, totalCards };
  };

  const { currentCards, totalCards } = getCardCounts();
  const completionPercentage = totalCards > 0 ? (currentCards / totalCards) * 100 : 0;

  return (
    <div className="mb-6">
      <button
        onClick={toggleExpansion}
        className="w-full flex items-center justify-between p-4 bg-surface-700/50 border border-surface-600/50 rounded-t-xl text-left hover:bg-surface-700/70 transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-surface-50">
              {expansion}
            </span>
            <span className="text-sm text-surface-400">
              ({currentCards} / {totalCards})
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-24 h-2 bg-surface-600 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
          <span className="text-xs text-surface-400 font-medium">
            {Math.round(completionPercentage)}%
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 0 : 180 }}
          transition={{ duration: 0.2 }}
          className="text-surface-400 group-hover:text-surface-300"
        >
          <ChevronUpIcon className="w-5 h-5" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4 bg-surface-800/30 border-x border-b border-surface-600/50 rounded-b-xl">
              {cards.map((card) => {
                const key = card.id;
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
                    showAmounts={showAmounts}
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