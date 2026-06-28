import Image from 'next/image'
import { Card } from '../types'
import { Card as ShadcnCard, CardContent } from "@/components/ui/primitives/card"

interface DeckDisplayProps {
  deckListing: Card[]
}

export function DeckDisplay({ deckListing }: DeckDisplayProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {deckListing.map((card, index) => (
        <ShadcnCard key={index}>
          <CardContent className="p-0">
            <div className="relative aspect-[2.5/3.5]">
              <Image
                src={`/img/games/tcgpocket/cards/${card.pack}/${card.cardNumber}.jpg`}
                alt={`Card ${card.pack}-${card.cardNumber}`}
                fill
                className="object-cover rounded-sm"
              />
              <div className="absolute bottom-1 right-1 bg-primary-hover  text-black px-2  text-xs py-1 rounded-xl">
                x{card.quantity}
              </div>
            </div>
          </CardContent>
        </ShadcnCard>
      ))}
    </div>
  )
}

