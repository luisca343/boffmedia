"use client";

import BoffLayout from "@/app/(boffmedia)/_components/BoffLayout";
import { boffGET } from "@/services/boffAPI";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { CardsList } from "../_components/CardsList";
import { Car } from "lucide-react";

interface Card {
  expansion: string;
  number: number;
  name: string;
}

export default function TCGPocket() {
  const [cards, setCards] = useState<Card[]>([]);
  const dungeonsTrans = useTranslations("tcgpocket");

  useEffect(() => {
    boffGET("/herramientas/ptcgp/cards").then((data: Card[]) => {
      console.log(data);
      setCards(data);
    });
  }, []);

  const groupedCards = cards.reduce((acc, card) => {
    if (!acc[card.expansion]) {
      acc[card.expansion] = [];
    }
    acc[card.expansion].push(card);
    return acc;
  }, {} as { [key: string]: Card[] });

  return (
    <BoffLayout>
      <div className="container mx-auto px-4">
        {Object.keys(groupedCards).map((expansion) => {
          return (
            <>
              <h2 className="text-4xl font-bold mb-4 text-primary-300">
                {dungeonsTrans(expansion)}
              </h2>
              <CardsList key={expansion} cards={groupedCards[expansion]} />
            </>
          );
        })}
      </div>
    </BoffLayout>
  );
}
