import { getTranslations } from "next-intl/server";
import { Container, Heading } from "@/components/ui";
import { WingullSpotlight } from "./WingullSpotlight";
import { SmartRotomSpotlight } from "./SmartRotomSpotlight";
import { SectionSeparator } from "../ui/SectionSeparator";
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
      className="min-h-screen pb-20 relative overflow-hidden flex flex-col bg-gradient-to-b from-surface-800 via-secondary-900/50 to-surface-700 pt-8"
    >
      <Container size="lg" className="relative z-10 flex flex-col h-full">
        <div className="text-center mb-6">
          <div className="inline-block">
            <Heading
              as="h2"
              size="xl"
              weight="black"
              orbitron
              className="my-4 text-transparent bg-clip-text bg-gradient-to-r from-primary-300 via-primary-400 to-primary-500"
            >
              {t("featuredGames.title")}
            </Heading>
            <div className="h-[2px] w-24 bg-gradient-to-r from-primary-500 to-primary-300 mx-auto opacity-70" />
          </div>
        </div>
        <WingullSpotlight t={t} />
        <SectionSeparator variant="orange" />
        <SmartRotomSpotlight t={t} />
        <SectionSeparator variant="purple" />
        <ToolsSpotlight t={t} />
      </Container>
      {/* Bottom SVG Wave */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden z-10">
        <svg className="relative block w-full h-20" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V120H0Z" className="fill-surface-800" ></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V120H0Z" className="fill-surface-950 "></path>
        </svg>
      </div> 
    </section>
  );
}