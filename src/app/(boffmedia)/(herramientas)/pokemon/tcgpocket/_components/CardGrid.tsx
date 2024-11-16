import { AnimatePresence } from "framer-motion"
import { CardItem } from "./CardItem"
import { Card } from '../types'

interface CardGridProps {
  allCards: Card[]
  userCards: Record<string, number>
  changes: Record<string, number>
  hideMissingCards: boolean
  editable: boolean
  loading: boolean
  handleAddCard: (card: Card) => void
  handleRemoveCard: (card: Card) => void
  trans: (key: string) => string
  showAmounts: boolean
}

export function CardGrid({
  allCards,
  userCards,
  changes,
  hideMissingCards,
  editable,
  loading,
  handleAddCard,
  handleRemoveCard,
  trans,
  showAmounts
}: CardGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
      <AnimatePresence>
        {allCards.map((card) => {
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
              showAmounts={showAmounts}
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
}