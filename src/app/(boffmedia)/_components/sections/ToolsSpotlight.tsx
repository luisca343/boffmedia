import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ToolsSpotlightVideoBg } from "./ToolSpotlightVideoBg";

interface ToolsSpotlightProps {
  t: (key: string) => string;
}

export function ToolsSpotlight({ t }: ToolsSpotlightProps) {
  return (
    <section
      className="relative w-full pt-32 -mb-16 flex flex-col items-center justify-center overflow-hidden"
      aria-labelledby="tools-hero-title"
    >
      <ToolsSpotlightVideoBg />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center w-full aspect-[2/1]">
        {/* Logo */}
        <div className="mb-8">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-yellow-500/20 rounded-2xl blur-2xl w-40 h-40"></div>
            <Image
              src="/img/tools.png"
              alt="Tools"
              width={160}
              height={160}
              className="relative rounded-xl"
              priority
            />
          </div>
        </div>
        {/* Title & Description */}
        <h3
          id="tools-hero-title"
          className="text-6xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400 mb-6 drop-shadow-lg"
        >
          {t("featuredGames.games.tools.title")}
        </h3>
        <p className="text-2xl md:text-3xl text-surface-200 leading-relaxed text-center mb-14 max-w-5xl mx-auto drop-shadow">
          {t("featuredGames.games.tools.description")}
        </p>

        {/* Features - spread horizontally */}
        <div className="flex flex-wrap justify-center gap-x-16 gap-y-6 mb-16 w-full text-xl font-semibold">
          <Feature text="Calculadoras y generadores" />
          <Feature text="Bases de datos de juegos" />
          <Feature text="Herramientas para la comunidad" />
          <Feature text="Actualizaciones frecuentes" />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <Button className="bg-yellow-500 hover:bg-yellow-600 text-white px-12 py-5 text-xl font-bold shadow-lg" asChild>
            <Link href="/herramientas" className="flex items-center justify-center gap-3">
              {t("featuredGames.viewMore")}
              <ArrowRight className="h-6 w-6" />
            </Link>
          </Button>
          <Button
            variant="outline"
            className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 px-10 py-5 text-xl font-bold"
          >
            {t("featuredGames.status.new")}
          </Button>
        </div>
      </div>
      <div className="absolute top-0 left-0 w-full overflow-hidden z-10 pointer-events-none">
          <svg
            className="relative block w-full h-20 rotate-180"
            data-name="Layer 1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V120H0Z"
              className="fill-surface-900"
            ></path>
            <path
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V120H0Z"
              className="fill-surface-700"
            ></path>
          </svg>
        </div>

        
      {/* Bottom SVG Wave */}
      <div className="absolute bottom-16 left-0 w-full overflow-hidden z-10">
        <svg className="relative block w-full h-20" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V120H0Z" className="fill-surface-800" ></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V120H0Z" className="fill-surface-900 "></path>
        </svg>
      </div>
    </section>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-yellow-300 text-xl font-semibold whitespace-nowrap">
      <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
      <span>{text}</span>
    </div>
  );
}