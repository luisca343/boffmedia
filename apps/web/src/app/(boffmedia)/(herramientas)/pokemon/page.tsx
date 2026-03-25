"use client";

import { Diamond, Zap, Database } from "lucide-react";
import { useTranslations } from "next-intl";
import { ToolsPageLayout } from "@/components/boffmedia/tools/ToolsPageLayout";

export default function PokemonPage() {
  const t = useTranslations("pokemon");

  const pokemonTools = [
    {
      title: t("tools.tcgpocket.title"),
      description: t("tools.tcgpocket.description"),
      icon: "/img/games/tcgpocket-icon.webp",
      iconFallback: <Diamond className="h-8 w-8 text-yellow-400" />,
      href: "/pokemon/tcgpocket",
      color: "from-yellow-300 to-yellow-500",
      tools: [t("tools.tcgpocket.features.gallery"), t("tools.tcgpocket.features.cardList"), t("tools.tcgpocket.features.battles")],
      featured: true,
      isNew: true,
      popularity: "high",
      heroImage: "/img/games/tcgpocket/hero.webp"
    },
    {
      title: t("tools.pmdsky.title"),
      description: t("tools.pmdsky.description"),
      icon: "/img/games/pmdsky-icon.webp",
      iconFallback: <Zap className="h-8 w-8 text-secondary-400" />,
      href: "/pokemon/pmdsky",
      color: "from-secondary-400 to-cyan-600",
      tools: [t("tools.pmdsky.features.skyGenerator")],
      featured: false,
      isNew: false,
      popularity: "medium"
    },
    {
      title: t("tools.pokedex.title"),
      description: t("tools.pokedex.description"),
      icon: "/img/games/pokedex-icon.webp",
      iconFallback: <Database className="h-8 w-8 text-red-500" />,
      href: "/pokemon/pokedex",
      color: "from-red-500 to-rose-600",
      tools: [t("tools.pokedex.features.pokedex")],
      featured: false,
      isNew: false,
      popularity: "high"
    }
  ];

  const externalLinks = [
    { 
      href: "https://www.pokemon.com/es/", 
      title: t("externalLinks.officialWebsite"),
      description: "Sitio oficial de Pokémon"
    },
    { 
      href: "https://pokemondb.net/", 
      title: t("externalLinks.pokemonDatabase"),
      description: "Base de datos completa"
    },
    { 
      href: "https://bulbapedia.bulbagarden.net/", 
      title: t("externalLinks.bulbapedia"),
      description: "Wiki de la comunidad"
    }
  ];

  return (
    <ToolsPageLayout
      title={{
        prefix: t("header.title.prefix"),
        highlight: t("header.title.highlight")
      }}
      subtitle={t("header.subtitle")}
      logoSrc="/img/games/pokemon/logo.webp"
      logoAlt="Pokémon"
      tools={pokemonTools}
      externalLinks={externalLinks}
      t={t}
    />
  );
}