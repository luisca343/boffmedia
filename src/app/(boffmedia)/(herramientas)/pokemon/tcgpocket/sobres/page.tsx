"use client";

import { InternalLink } from "@/components/nav/Link";
import { boffGET } from "@/services/boffAPI";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface Card {
  expansion: string;
  number: number;
  name: string;
}

export default function TCGPocket() {
  const [cards, setCards] = useState<Card[]>([]);
  const trans = useTranslations("tcgpocket");

  useEffect(() => {
    boffGET("/herramientas/ptcgp/boosterpacks").then((data: Card[]) => {
      console.log(data);
      setCards(data);
    });
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-white text-center">
        TCG Pocket Booster Packs
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {cards.map((pack, index) => (
          <motion.div
            key={pack.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <InternalLink
              href={`/tcgpocket/sobres/${pack.expansion}`}
              className="group block"
            >
              <div className="relative bg-surface-800/50 backdrop-blur-sm rounded-xl p-3 transition-all duration-300 hover:bg-surface-700/50 hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl">
                <div className="relative w-full pb-[140%]">
                  <Image
                    src={`/img/tcgpocket/packs/${
                      pack.expansion
                    }/${pack.name.toLowerCase()}.png`}
                    alt={pack.name}
                    fill
                    className="object-contain rounded-lg transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    priority={index < 10}
                  />
                </div>
                <div className="mt-2">
                  <h3 className="text-sm text-white text-center truncate font-medium">
                    {trans(pack.expansion)} - {pack.name}
                  </h3>
                </div>
              </div>
            </InternalLink>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
