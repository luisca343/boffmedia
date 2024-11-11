"use client";

import BoffLayout from "@/app/(boffmedia)/_components/BoffLayout";
import { InternalLink } from "@/components/nav/Link";
import { boffGET } from "@/services/boffAPI";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface Card {
  expansion: string;
  number: number;
  name: string;
}

export default function TCGPocket() {
  const [cards, setCards] = useState<Card[]>([]);
  const trans = useTranslations("tgcpocket");

  useEffect(() => {
    boffGET("/herramientas/ptcgp/boosterpacks").then((data: Card[]) => {
      console.log(data);
      setCards(data);
    });
  }, []);

  return (
    <BoffLayout>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-5 gap-4">
          {cards.map((pack, index) => (
            <InternalLink key={index} className="flex flex-col items-center" href={`/pokemon/tcgpocket/sobre/${pack.expansion}`}>
              <img
                src={`/img/tcgpocket/packs/${
                  pack.expansion
                }/${pack.name.toLowerCase()}.png`}
                alt={pack.name}
                className="w-full h-auto object-contain"
              />
              <h3 className="mt-2 text-center text-sm font-medium">
                {trans(pack.expansion)} - {pack.name}
              </h3>
            </InternalLink>
          ))}
        </div>
      </div>
    </BoffLayout>
  );
}
