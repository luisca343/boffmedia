"use client"

import BoffLayout from "@/app/(boffmedia)/_components/BoffLayout";
import { boffGET } from "@/services/boffAPI";
import { useEffect, useState } from "react";
import Image from 'next/image';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface Card {
  id: number;
  expansion: string;
  name: string;
  number: number;
  rarity: string;
  type: string;
  hp: number;
  weakness: string;
  weakness_value: number;
  retreat_cost: number;
}

export default function Expansions({ params }: { params: { params: [expansion: string, id: string] } }) {
  const [expansion, id] = params.params;
  const [cardData, setCardData] = useState<Card | null>(null);
  const trans = useTranslations("tcgpocket");

  useEffect(() => {
    boffGET(`/herramientas/ptcgp/cards/${expansion}/${id}`).then((data: Card) => {
      setCardData(data);
    });
  }, [expansion, id]);

  const typeTranslations: { [key: string]: string } = {
    grass: "Planta",
    fire: "Fuego",
    water: "Agua",
    electric: "Eléctrico",
    psychic: "Psíquico",
    fighting: "Lucha",
    darkness: "Oscuridad",
    metal: "Metal",
    dragon: "Dragón",
    colorless: "Incoloro",
  };

  const getRarityImages = (rarity: string) => {
    const [rarityType, rarityNumber] = rarity.match(/([a-z]+)(\d*)/)?.slice(1) || [];
    const count = parseInt(rarityNumber) || 1;
    return Array(count).fill(null).map((_, index) => (
      <Image
        key={index}
        src={`/img/tcgpocket/image/${rarityType}.png`}
        alt={`${rarityType} rarity`}
        width={24}
        height={24}
        className="inline-block mr-1"
      />
    ));
  };

  if (!cardData) {
    return (
      <BoffLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-xl">Cargando...</div>
        </div>
      </BoffLayout>
    );
  }

  return (
    <BoffLayout>
        <div className="container mx-auto px-4 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row gap-12 items-start"
          >
            {/* Card Image Section */}
            <motion.div 
              className="w-full lg:w-1/2 xl:w-2/5"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-main via-surface-foreground to-main rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <Image
                  src={`/img/tcgpocket/cards/${expansion}/${id}.jpg`}
                  alt={cardData.name}
                  width={400}
                  height={558}
                  className="relative rounded-lg shadow-2xl"
                />
              </div>
            </motion.div>

            {/* Card Details Section */}
            <div className="w-full lg:w-1/2 xl:w-3/5">
              <div className="backdrop-blur-md bg-black/30 rounded-2xl p-8 shadow-xl border border-white/10">
                <h1 className="text-4xl font-bold mb-8 text-white">{cardData.name}</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Basic Info */}
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-surface-400 mb-1">Número</p>
                      <p className="text-xl text-white">{cardData.number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-surface-400 mb-1">Expansión</p>
                      <p className="text-xl text-white">{trans(cardData.expansion)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-surface-400 mb-1">Rareza</p>
                      <div className="flex items-center">
                        {getRarityImages(cardData.rarity)}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-surface-400 mb-1">Tipo</p>
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-white/10 rounded-full">
                          <Image
                            src={`/img/tcgpocket/image/${cardData.type}.png`}
                            alt={typeTranslations[cardData.type]}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        </div>
                        <span className="text-xl text-white">{typeTranslations[cardData.type]}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-surface-400 mb-1">PS</p>
                      <p className="text-xl text-white">{cardData.hp}</p>
                    </div>

                    <div>
                      <p className="text-sm text-surface-400 mb-1">Debilidad</p>
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-white/10 rounded-full">
                          <Image
                            src={`/img/tcgpocket/image/${cardData.weakness}.png`}
                            alt={typeTranslations[cardData.weakness]}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        </div>
                        <span className="text-xl text-white">
                          {typeTranslations[cardData.weakness]} ({cardData.weakness_value})
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-surface-400 mb-1">Coste de Retirada</p>
                      <div className="flex items-center gap-2">
                        {[...Array(cardData.retreat_cost)].map((_, index) => (
                          <div key={index} className="p-1 bg-white/10 rounded-full">
                            <Image
                              src="/img/tcgpocket/image/colorless.png"
                              alt="Energía Incolora"
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          </div>
                        ))}
                        <span className="text-xl text-white">{cardData.retreat_cost}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
    </BoffLayout>
  );
}