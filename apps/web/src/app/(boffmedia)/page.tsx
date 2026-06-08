
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { CommunitySection } from "./_components/sections/CommunitySection";
import { EventsSection } from "./_components/sections/EventsSection";
import { FeaturedSection } from "./_components/sections/FeaturedSection";
import { HeroSection } from "./_components/sections/HeroSection";
import { ToolsSpotlight } from "./_components/sections/ToolsSpotlight";

function EventsSectionSkeleton() {
  return (
    <section className="pt-20 pb-48 bg-gradient-to-b from-surface-950 via-accent-900/30 to-surface-800 relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 space-y-8">
        <div className="h-10 w-64 bg-surface-700 rounded-lg animate-pulse mx-auto" />
        <div className="h-5 w-96 bg-surface-700 rounded animate-pulse mx-auto" />
        <div className="h-64 w-full bg-surface-800/80 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-surface-800/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  const t = await getTranslations("boffmedia");
  return (
    <>
      <HeroSection />
      <FeaturedSection />
      <Suspense fallback={<EventsSectionSkeleton />}>
        <EventsSection />
      </Suspense>
      <CommunitySection />
      {/*<CtaSection />*/}
    </>
  )
}

