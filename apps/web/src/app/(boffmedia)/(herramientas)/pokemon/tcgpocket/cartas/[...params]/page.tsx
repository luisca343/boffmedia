"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { PtcgpService } from "@/services/api/boffmedia/ptcgpService";
import { TcgCard } from "@boffmedia/shared";

interface Card {
  id: number;
  expansion: string;
  name: string;
  number: number;
  rarity: string;
  types: string[];
  hp: number;
  weaknesses: Array<{
    type: string;
    value: string;
  }>;
  retreat_cost: number;
}

export default function Expansions({
  params,
}: {
  params: { params: [id: string] };
}) {
  const [id] = params.params;
  const [cardData, setCardData] = useState<TcgCard | null>(null);
  const [sets, setSets] = useState<{ id: string; name: string }[]>([]);
  const t = useTranslations("tcgpocket");
  const locale = useLocale();

  useEffect(() => {
    PtcgpService.getCardById(id, locale).then(
      (response) => {
        console.log("Card data:", response.data);
        setCardData(response.data as TcgCard);
      }
    );

    PtcgpService.getSetsForSeries("tcgp", locale).then(
      (response) => {
        setSets(response.data!);
      }
    );

  }, [id]);

  const getRarityImages = (rarity: string) => {
    const numberMap: { [key: string]: string } = {
      'one': '1',
      'two': '2', 
      'three': '3',
      'four': '4',
      'five': '5',
      'six': '6',
      'seven': '7',
      'eight': '8',
      'nine': '9',
      'ten': '10'
    };

    // Convert rarity like "Three Diamond" to "diamond3"
    const words = rarity.toLowerCase().split(' ');
    let rarityType = '';
    let count = 1;

    if (words.length === 2) {
      const [numberWord, typeWord] = words;
      count = parseInt(numberMap[numberWord]) || 1;
      rarityType = typeWord;
    } else if (words.length === 1) {
      // Handle cases like "shiny", "star", etc. without numbers
      rarityType = words[0];
      count = 1;
    }

    return Array(count)
      .fill(null)
      .map((_, index) => (
        <Image
          key={index}
          src={`/img/games/tcgpocket/image/${rarityType}.png`}
          alt={`${rarityType} rarity`}
          width={24}
          height={24}
          className="inline-block mr-1"
        />
      ));
  };

  if (!cardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl">{t("cardDetail.loading")}</div>
      </div>
    );
  }

  return (
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
              src={cardData.image!}
              alt={cardData.name}
              width={400}
              height={558}
              className="relative rounded-lg shadow-2xl"
            />
          </div>
        </motion.div>

        {/* Card Details Section */}
        <div className="w-full lg:w-1/2 xl:w-3/5 space-y-6">
          {/* Main Stats Grid */}
          <div className="backdrop-blur-md bg-black/30 rounded-2xl p-8 shadow-xl border border-white/10">
            {/* Header with name and badges */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4 text-white">
                {cardData.name}
              </h1>
              
              {/* Category and Stage */}
              <div className="flex items-center gap-4 mb-6">
                <span className="px-3 py-1 bg-main/20 rounded-full text-main font-medium">
                  {cardData.category}
                </span>
                {cardData.stage && (
                  <span className="px-3 py-1 bg-surface-foreground/20 rounded-full text-surface-foreground font-medium">
                    {cardData.stage}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Info */}
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-ink-muted mb-1">{t("cardDetail.number")}</p>
                  <p className="text-xl text-white">{cardData.id}</p>
                </div>
                <div>
                  <p className="text-sm text-ink-muted mb-1">{t("cardDetail.expansion")}</p>
                  <p className="text-xl text-white">
                    {cardData.setName || t("cardDetail.unknownExpansion")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-ink-muted mb-1">{t("cardDetail.rarity")}</p>
                  <div className="flex items-center">
                    {getRarityImages(cardData.rarity)}
                  </div>
                </div>
                {cardData.illustrator && (
                  <div>
                    <p className="text-sm text-ink-muted mb-1">{t("cardDetail.illustrator")}</p>
                    <p className="text-xl text-white">{cardData.illustrator}</p>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-ink-muted mb-1">{t("cardDetail.type")}</p>
                  <div className="flex items-center gap-2">
                    {cardData.types?.map((type, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="p-1 bg-white/10 rounded-full">
                          <Image
                            src={`/img/games/tcgpocket/image/${type.toLowerCase()}.png`}
                            alt={t(`types.${type.toLowerCase()}`)}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        </div>
                        <span className="text-xl text-white">
                          {t(`types.${type.toLowerCase()}`)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-ink-muted mb-1">{t("cardDetail.hp")}</p>
                  <p className="text-xl text-white">{cardData.hp}</p>
                </div>

                <div>
                  <p className="text-sm text-ink-muted mb-1">{t("cardDetail.weakness")}</p>
                  <div className="flex flex-col gap-2">
                    {cardData.weaknesses?.map((weakness, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="p-1 bg-white/10 rounded-full">
                          <Image
                            src={`/img/games/tcgpocket/image/${weakness.type.toLowerCase()}.png`}
                            alt={t(`types.${weakness.type.toLowerCase()}`)}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        </div>
                        <span className="text-xl text-white">
                          {t(`types.${weakness.type.toLowerCase()}`)} ({weakness.value})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-ink-muted mb-1">
                    {t("cardDetail.retreatCost")}
                  </p>
                  <div className="flex items-center gap-2">
                    {[...Array(cardData.retreat)].map((_, index) => (
                      <div key={index} className="p-1 bg-white/10 rounded-full">
                        <Image
                          src="/img/games/tcgpocket/image/colorless.png"
                          alt={t("types.colorless")}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      </div>
                    ))}
                    <span className="text-xl text-white">
                      {cardData.retreat}
                    </span>
                  </div>
                </div>

                {/* Boosters */}
                {cardData.boosters && cardData.boosters.length > 0 && (
                  <div>
                    <p className="text-sm text-ink-muted mb-1">{t("cardDetail.boosters")}</p>
                    <div className="flex flex-wrap gap-2">
                      {cardData.boosters.map((booster, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 text-ink rounded-md text-main text-sm font-medium"
                        >
                          {booster.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {cardData.description && (
            <div className="backdrop-blur-md bg-black/30 rounded-2xl p-8 shadow-xl border border-white/10">
              <h3 className="text-2xl font-bold mb-4 text-white">{t("cardDetail.description")}</h3>
              <p className="text-ink leading-relaxed italic">
                &quot;{cardData.description}&quot;
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}