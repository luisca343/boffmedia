import { getTranslations } from "next-intl/server";
import { FloatingSection } from "../layout/FloatingSection";
import { WingullSpotlight } from "./WingullSpotlight";
import { SmartRotomSpotlight } from "./SmartRotomSpotlight";
import { GamesGrid } from "./GamesGrid";
import { SectionSeparator } from "../ui/SectionSeparator";
import { Float } from "@react-three/drei";
import { ToolsSpotlight } from "./ToolsSpotlight";

export async function FeaturedSection() {
  const t = await getTranslations("boffmedia");

  const games = [
    {
      title: t("featuredGames.games.smartrotom.title"),
      description: t("featuredGames.games.smartrotom.description"),
      image: "/img/smartrotom.png",
      status: t("featuredGames.status.comingSoon"),
      link: "/smartrotom",
    },
    {
      title: t("featuredGames.games.tools.title"),
      description: t("featuredGames.games.tools.description"),
      image: "/img/tools.png",
      status: t("featuredGames.status.new"),
      link: "/herramientas",
    }
  ];

  return (
    <section
      className="min-h-screen pb-20 relative overflow-hidden flex flex-col bg-gradient-to-b from-surface-800 via-blue-900/50 to-surface-700"
    >
      <div className="relative mx-auto z-10 flex flex-col h-full">
      <div className="text-center mb-6">
        <div className="inline-block">
          <h2 className="text-6xl font-extrabold my-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-400 to-amber-400 drop-shadow-lg">
            {t("featuredGames.title")}
          </h2>
          <div className="h-1 w-32 bg-gradient-to-r from-orange-500 to-amber-400 mx-auto rounded-full"></div>
        </div>
      </div>
        <WingullSpotlight t={t} />
        <SectionSeparator variant="purple" />
        <SmartRotomSpotlight t={t} />
      </div>        
    </section>
  );
}