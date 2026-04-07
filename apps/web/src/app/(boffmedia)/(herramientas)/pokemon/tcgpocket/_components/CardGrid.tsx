import { AnimatePresence } from "framer-motion"
import { CardItem } from "./CardItem"
import { TcgCard } from "@boffmedia/shared"

interface CardGridProps {
  cards: TcgCard[]
  userCards?: Record<string, number>
  changes?: Record<string, number>
  hideMissingCards?: boolean
  editable?: boolean
  loading?: boolean
  handleAddCard?: (card: TcgCard) => void
  handleRemoveCard?: (card: TcgCard) => void
  trans: (key: string) => string
  showAmounts?: boolean
  linkTo?: (card: TcgCard) => string
  allColored?: boolean
}

export function CardGrid({
  cards,
  userCards = {},
  changes = {},
  hideMissingCards = false,
  editable = false,
  loading = false,
  handleAddCard,
  handleRemoveCard,
  trans,
  showAmounts = false,
  linkTo,
  allColored = false
}: CardGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
      <AnimatePresence>
        {cards.map((card) => {
          const key = card.id
          const count = (userCards[key] || 0) + (changes[key] || 0)
          const isMissing = !allColored && count === 0

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
              linkTo={linkTo ? linkTo(card) : undefined}
              allColored={allColored}
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
}