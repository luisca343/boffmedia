import React from "react";
import { Container, Heading, Text, Stack } from "@/components/ui";
import {
  GiWoodenCrate,
  GiStoneBlock,
  GiAnvil,
  GiGoldBar,
  GiCutDiamond,
} from "react-icons/gi";
import { FaAward, FaMedal, FaStar } from "react-icons/fa";
import { cn } from "@/lib/utils";

type RarityType = "bronce" | "plata" | "oro" | "platino" | "diamante";

type Achievement = {
  name: string;
  description: string;
  rarity: RarityType;
  points: number;
};

type BadgeProps = {
  rarity: RarityType;
  className?: string;
};

const rarityConfig: Record<
  RarityType,
  { icon: any; color: string; bgColor: string }
> = {
  bronce: { icon: FaAward, color: "text-orange-400", bgColor: "bg-orange-900" },
  plata: { icon: FaAward, color: "text-surface-300", bgColor: "bg-surface-700" },
  oro: { icon: FaMedal, color: "text-yellow-400", bgColor: "bg-yellow-900" },
  platino: { icon: FaStar, color: "text-cyan-400", bgColor: "bg-cyan-900" },
  diamante: {
    icon: GiCutDiamond,
    color: "text-secondary-400",
    bgColor: "bg-secondary-900",
  },
};

function AchievementBadge({ rarity, className }: BadgeProps) {
  const { icon: Icon, color, bgColor } = rarityConfig[rarity];

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center w-12 h-12 rounded-full",
        bgColor,
        className
      )}
    >
      <Icon className={cn("w-8 h-8", color)} aria-hidden="true" />
      <span className="sr-only">{`Insignia de ${rarity}`}</span>
    </div>
  );
}

const achievements: Achievement[] = [
  {
    name: "Primer Paso",
    description: "Mata tu primer zombie",
    rarity: "bronce",
    points: 10,
  },
  {
    name: "Paseo Corto",
    description: "Camina 1 km",
    rarity: "bronce",
    points: 10,
  },
  {
    name: "Exterminador Novato",
    description: "Elimina 100 zombies",
    rarity: "plata",
    points: 50,
  },
  {
    name: "Exterminador Experimentado",
    description: "Elimina 500 zombies",
    rarity: "oro",
    points: 100,
  },
  {
    name: "Exterminador Experto",
    description: "Elimina 1,000 zombies",
    rarity: "platino",
    points: 200,
  },
  {
    name: "Caminante",
    description: "Camina 10 km",
    rarity: "plata",
    points: 50,
  },
  {
    name: "Trotamundos",
    description: "Camina 50 km",
    rarity: "oro",
    points: 100,
  },
  {
    name: "Maratonista",
    description: "Camina 100 km",
    rarity: "platino",
    points: 200,
  },
  {
    name: "Superviviente Novato",
    description: "Sobrevive 1 día",
    rarity: "bronce",
    points: 20,
  },
  {
    name: "Superviviente Experimentado",
    description: "Sobrevive 7 días",
    rarity: "plata",
    points: 70,
  },
  {
    name: "Superviviente Experto",
    description: "Sobrevive 14 días",
    rarity: "oro",
    points: 140,
  },
  {
    name: "Leyenda de la Supervivencia",
    description: "Sobrevive 30 días",
    rarity: "platino",
    points: 300,
  },
  {
    name: "Noche al Raso",
    description: "Pasa una noche completa sin refugiarte",
    rarity: "oro",
    points: 150,
  },
  {
    name: "Cazador Novato",
    description: "Encuentra tu primera escopeta",
    rarity: "bronce",
    points: 30,
  },
  {
    name: "Francotirador Principiante",
    description: "Encuentra tu primer rifle",
    rarity: "plata",
    points: 60,
  },
  {
    name: "Coleccionista Pokémon Novato",
    description: "Colecciona 10 cartas Pokémon diferentes",
    rarity: "bronce",
    points: 20,
  },
  {
    name: "Coleccionista Pokémon Avanzado",
    description: "Colecciona 50 cartas Pokémon diferentes",
    rarity: "plata",
    points: 100,
  },
  {
    name: "Coleccionista Pokémon Experto",
    description: "Colecciona 100 cartas Pokémon diferentes",
    rarity: "oro",
    points: 200,
  },
  {
    name: "Coleccionista Pokémon Legendario",
    description: "Colecciona 500 cartas Pokémon diferentes",
    rarity: "platino",
    points: 500,
  },
  {
    name: "Coleccionista Pokémon Maestro",
    description: "Colecciona 1,000 cartas Pokémon diferentes",
    rarity: "diamante",
    points: 1000,
  },
  {
    name: "Card Captor",
    description: "Encuentra el bastón de Sakura",
    rarity: "platino",
    points: 500,
  },
];

export default function AchievementList() {
  return (
    <Container size="sm" className="flex flex-col items-center">
      <Heading as="h2" size="lg" weight="bold" className="mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
        Lista de Logros
      </Heading>
      <Stack direction="vertical" gap={4} className="w-full max-w-lg">
        {achievements.map((achievement, index) => (
          <Stack
            key={index}
            direction="horizontal"
            gap={4}
            align="center"
            className="p-4 bg-surface-800 rounded-lg border border-orange-800 shadow-lg hover:bg-surface-700 transition-colors duration-200"
          >
            <AchievementBadge rarity={achievement.rarity} />
            <div className="flex-grow">
              <Text as="span" size="lg" weight="semibold" className="text-orange-400 block">
                {achievement.name}
              </Text>
              <Text size="sm" color="muted">{achievement.description}</Text>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-lg font-bold text-yellow-400">{achievement.points}</span>
              <Text as="span" size="sm" color="muted" className="ml-1">pts</Text>
            </div>
          </Stack>
        ))}
      </Stack>
    </Container>
  );
}
