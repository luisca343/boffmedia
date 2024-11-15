"use client"

import { InternalLink } from "@/components/nav/Link";
import Image from "next/image";
import { motion } from "framer-motion";

interface Card {
  expansion: string;
  number: number;
  name: string;
}

export function CardsList({ cards }: { cards: Card[] }) {
  return (
    <div className="grid grid-cols-5 gap-6 p-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.number}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <InternalLink
            href={`/tcgpocket/cartas/${card.expansion}/${card.number}`}
            className="group block"
          >
            <div className="relative bg-surface-800/50 backdrop-blur-sm rounded-xl p-3 transition-all duration-300 hover:bg-surface-700/50 hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl">
              <div className="relative w-full pb-[140%]">
                <Image
                  src={`/img/tcgpocket/cards/${card.expansion}/${card.number}.jpg`}
                  alt={card.name}
                  fill
                  className="object-contain rounded-lg transition-transform duration-300"
                  sizes="(max-width: 1920px) 20vw, 300px"
                  priority={index < 10}
                />
              </div>
              <div className="mt-2">
                <h3 className="text-sm text-white text-center truncate font-medium">
                  {card.name}
                </h3>
              </div>
            </div>
          </InternalLink>
        </motion.div>
      ))}
    </div>
  );
}