import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroSection } from "./_components/HeroSection";
import { FeaturedSection } from "./_components/FeaturedSection";

// Dynamic imports for better code splitting
const EventCalendar = dynamic(() => import("./_components/EventCalendar"), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false
});

const UpcomingEvents = dynamic(() => import("./_components/UpcomingEvents").then(mod => mod.UpcomingEvents), {
  loading: () => <Skeleton className="h-64 w-full" />
});

const ClassificationTable = dynamic(() => import("./_components/ClassificationTable").then(mod => mod.ClassificationTable), {
  loading: () => <Skeleton className="h-96 w-full" />
});

export default function GamingLandingPage() {
  return (
    <div className="min-h-screen text-white font-sans relative">
      <div className="relative z-10">
        <main className="container mx-auto px-4">
          <HeroSection />
          <FeaturedSection />

          <section className="mb-12 md:mb-24">
            <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-6 md:p-12 rounded-lg shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-black opacity-50" aria-hidden="true" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">
                  Eventos Destacados
                </h2>
                <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                  <UpcomingEvents />
                </Suspense>
              </div>
            </div>
          </section>

          <section className="mb-12 md:mb-24">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-yellow-400">
              Calendario de Eventos
            </h2>
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              <EventCalendar />
            </Suspense>
          </section>

          <section className="mb-12 md:mb-24">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              Tabla de Clasificación
            </h2>
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              <ClassificationTable />
            </Suspense>
          </section>
        </main>
      </div>
    </div>
  );
}

