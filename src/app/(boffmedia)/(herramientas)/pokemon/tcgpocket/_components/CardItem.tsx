import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Plus, Minus } from 'lucide-react'
import { Card } from '../types'
import { InternalLink } from "@/components/nav/Link"

interface CardItemProps {
  card: Card
  count?: number
  isMissing?: boolean
  editable?: boolean
  loading?: boolean
  handleAddCard?: (card: Card) => void
  handleRemoveCard?: (card: Card) => void
  trans: (key: string) => string
  showAmounts?: boolean
  linkTo?: string
  allColored?: boolean
}

export function CardItem({
  card,
  count = 0,
  isMissing = false,
  editable = false,
  loading = false,
  handleAddCard,
  handleRemoveCard,
  trans,
  showAmounts = false,
  linkTo,
  allColored = false
}: CardItemProps) {
  const cardContent = (
    <div className={`relative bg-surface-800 rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${!allColored && isMissing ? 'grayscale' : ''}`}>
      <div className="aspect-[2.5/3.5] relative">
        <Image
          src={`/img/tcgpocket/cards/${card.expansion}/${card.number}.jpg`}
          alt={card.name}
          layout="fill"
          objectFit="contain"
          className="transition-transform duration-300 group-hover:scale-110"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          priority
        />
        {!allColored && ((editable && showAmounts && count > 0) || (!editable && count > 0)) && (
          <div className="absolute top-2 right-2 bg-surface-600 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-md">
            {count}
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <h3 className="text-sm font-medium truncate">
            {card.name}
          </h3>
          <p className="text-xs text-surface-300">{trans(card.expansion)} - #{card.number}</p>
          {editable && (
            <div className="flex justify-between items-center mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRemoveCard && handleRemoveCard(card)}
                className="p-1 rounded-full bg-surface-600 hover:bg-surface-500 border-none"
                disabled={loading || count === 0}
              >
                <Minus className="h-4 w-4 text-white" />
              </Button>
              <span className="text-white font-bold">
                {count}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddCard && handleAddCard(card)}
                className="p-1 rounded-full bg-surface-600 hover:bg-surface-500 border-none"
                disabled={loading}
              >
                <Plus className="h-4 w-4 text-white" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      {linkTo ? (
        <InternalLink href={linkTo} className="block">
          {cardContent}
        </InternalLink>
      ) : (
        cardContent
      )}
    </motion.div>
  )
}