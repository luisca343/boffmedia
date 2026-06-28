import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/primitives/button"
import { Plus, Minus } from 'lucide-react'
import { InternalLink } from "@/components/ui/navigation/Link"
import { TcgCard } from "@boffmedia/shared"

interface CardItemProps {
  card: TcgCard
  count?: number
  isMissing?: boolean
  editable?: boolean
  loading?: boolean
  handleAddCard?: (card: TcgCard) => void
  handleRemoveCard?: (card: TcgCard) => void
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
    <div className={`
      relative bg-layer-2/50 border border-edge/30 rounded-lg sm:rounded-xl overflow-hidden 
      transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:border-edge/50
      ${!allColored && isMissing ? 'grayscale opacity-60' : ''}
    `}>
      <div className="aspect-[2.5/3.5] relative">
        <Image
          src={card.image!}
          alt={card.name}
          fill={true}
          className="transition-transform duration-300 group-hover:scale-110"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />
        {!allColored && ((editable && showAmounts && count > 0) || (!editable && count > 0)) && (
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-layer-3/90 border border-edge/50 text-ink font-bold rounded-full w-5 h-5 lg:w-8 sm:h-8 flex items-center justify-center shadow-lg text-xs backdrop-blur-sm">
            {count}
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-1 sm:p-2 text-white">
          <h3 className="text-xs sm:text-sm font-medium truncate text-ink">
            {card.name}
          </h3>
          <p className="text-xs text-ink">{card.name} - #{card.id}</p>
          {editable && (
            <div className="flex justify-between items-center mt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRemoveCard && handleRemoveCard(card)}
                className="p-0.5 sm:p-1 rounded-full bg-layer-3/80 hover:bg-layer-3/80 border-edge/50 backdrop-blur-sm"
                disabled={loading || count === 0}
              >
                <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-ink" />
              </Button>
              <span className="text-ink font-bold text-xs sm:text-sm">
                {count}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddCard && handleAddCard(card)}
                className="p-0.5 sm:p-1 rounded-full bg-layer-3/80 hover:bg-layer-3/80 border-edge/50 backdrop-blur-sm"
                disabled={loading}
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-ink" />
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