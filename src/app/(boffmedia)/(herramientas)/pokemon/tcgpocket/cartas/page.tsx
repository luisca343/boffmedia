"use client";

import { boffGET } from "@/services/boffAPI";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { CardGrid } from "../_components/CardGrid";
import { Card } from "../types";
import { FilterComponent } from "../_components/FilterComponent";

export default function CartasPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expansionFilter, setExpansionFilter] = useState("");
  const dungeonsTrans = useTranslations("tcgpocket");

  useEffect(() => {
    boffGET("/herramientas/ptcgp/cards").then((data) => {
      /* @ts-ignore */
      setCards(data as Card[]);
    });
  }, []);

  const filteredCards = cards.filter(
    (card) =>
      (card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.number.toString().includes(searchTerm)) &&
      (expansionFilter === "" || card.expansion === expansionFilter)
  );

  const groupedCards = filteredCards.reduce((acc, card) => {
    if (!acc[card.expansion]) {
      acc[card.expansion] = [];
    }
    acc[card.expansion].push(card);
    return acc;
  }, {} as { [key: string]: Card[] });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-primary-300">
          Todas las Cartas
        </h1>
        <FilterComponent
          expansions={Array.from(new Set(cards.map((card) => card.expansion)))}
          onFilterChange={(name, expansion) => {
            setSearchTerm(name);
            setExpansionFilter(expansion);
          }}
          trans={dungeonsTrans}
        />
      </div>

      {Object.entries(groupedCards).map(([expansion, expansionCards]) => (
        <div key={expansion} className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-primary-300">
            {dungeonsTrans(expansion)}
          </h2>
          <CardGrid
            cards={expansionCards}
            trans={dungeonsTrans}
            linkTo={(card) =>
              `/tcgpocket/cartas/${card.expansion}/${card.number}`
            }
            allColored={true}
          />
        </div>
      ))}

      {Object.keys(groupedCards).length === 0 && (
        <p className="text-center text-surface-300 text-xl mt-8">
          No se encontraron cartas que coincidan con la búsqueda.
        </p>
      )}
    </div>
  );
}
