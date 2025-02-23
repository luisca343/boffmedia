import { CommunitySection } from "./_components/CommunitySection";
import { EventsSection } from "./_components/EventsSection";
import { FeaturedGames } from "./_components/FeaturedGames";
import { HeroSection } from "./_components/HeroSection";

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

