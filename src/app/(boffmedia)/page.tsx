
import { getTranslations } from "next-intl/server";
import { CommunitySection } from "./_components/sections/CommunitySection";
import { EventsSection } from "./_components/sections/EventsSection";
import { FeaturedSection } from "./_components/sections/FeaturedSection";
import { HeroSection } from "./_components/sections/HeroSection";
import { ToolsSpotlight } from "./_components/sections/ToolsSpotlight";

export default async function Home() {
  const t = await getTranslations("boffmedia");
  return (
    <div className="flex flex-col main">
      <HeroSection />
      <FeaturedSection />
      <ToolsSpotlight t={t} />
      <EventsSection />
      <CommunitySection />
      {/*<CtaSection />*/}
    </div>
  )
}

