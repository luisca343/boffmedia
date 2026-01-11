"use client";

import { Diamond, Zap, Database } from "lucide-react";
import { useTranslations } from "next-intl";
import { ToolsPageLayout } from "@/components/boffmedia/tools/ToolsPageLayout";

export default function PokemonPage() {
  const t = useTranslations(""); // global translations (ui, games)
  const tg = useTranslations("pokemon"); // game-specific translations

  const pokemonTools = [
    {
      title: tg("tools.tcgpocket.title"),
      description: tg("tools.tcgpocket.description"),
      icon: "/img/games/tcgpocket/icon.webp",
      iconFallback: <Diamond className="h-8 w-8 text-yellow-400" />,
      href: "/pokemon/tcgpocket",
      color: "from-yellow-300 to-yellow-500",
      tools: [tg("tools.tcgpocket.features.gallery"), tg("tools.tcgpocket.features.cardList"), tg("tools.tcgpocket.features.battles")],
      featured: true,
      isNew: true,
      popularity: "high",
      heroImage: "/img/games/tcgpocket/hero.webp"
    },
    {
      title: tg("tools.pmdsky.title"),
      description: tg("tools.pmdsky.description"),
      icon: "/img/games/pokemon/pmdsky.webp",
      iconFallback: <Zap className="h-8 w-8 text-secondary-400" />,
      href: "/pokemon/pmdsky",
      color: "from-secondary-400 to-cyan-600",
      tools: [tg("tools.pmdsky.features.skyGenerator")],
      featured: false,
      isNew: false,
      popularity: "medium"
    },
    {
      title: tg("tools.pokedex.title"),
      description: tg("tools.pokedex.description"),
      icon: "/img/games/pokemon/icon.webp",
      iconFallback: <Database className="h-8 w-8 text-red-500" />,
      href: "/pokemon/pokedex",
      color: "from-red-500 to-rose-600",
      tools: [tg("tools.pokedex.features.pokedex")],
      featured: false,
      isNew: false,
      popularity: "high"
    }
  ];

  const externalLinks = [
    { 
      href: "https://www.pokemon.com/es/", 
      title: tg("externalLinks.officialWebsite"),
      description: "Sitio oficial de Pokémon"
    },
    { 
      href: "https://pokemondb.net/", 
      title: tg("externalLinks.pokemonDatabase"),
      description: "Base de datos completa"
    },
    { 
      href: "https://bulbapedia.bulbagarden.net/", 
      title: tg("externalLinks.bulbapedia"),
      description: "Wiki de la comunidad"
    }
  ];

  return (
    <ToolsPageLayout
      title={{
        prefix: tg("header.title.prefix"),
        highlight: tg("header.title.highlight")
      }}
      subtitle={tg("header.subtitle")}
      logoSrc="/img/games/pokemon/logo.webp"
      logoAlt="Pokémon"
      tools={pokemonTools}
      externalLinks={externalLinks}
      t={t}
    />
  );
}