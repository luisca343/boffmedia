
import { CommunitySection } from "./_components/sections/CommunitySection";
import { EventsSection } from "./_components/sections/EventsSection";
import { FeaturedGames } from "./_components/sections/FeaturedGames";
import { HeroSection } from "./_components/sections/HeroSection";

export default function Home() {
  return (
    <div className="flex flex-col main">
      <HeroSection />
      <FeaturedGames />
      <EventsSection />
      <CommunitySection />
      {/*<CtaSection />*/}
    </div>
  )
}

