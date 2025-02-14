import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Smartphone,
  Gamepad2,
  ChevronRight,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";


export function HeroSection() {
  return (
    <section className="mb-12 md:mb-24 text-center">
      <Image
        src="/img/boff-logo.webp"
        alt="Logo de BoffMedia"
        width={150}
        height={150}
        className="mx-auto mb-6 md:mb-8 drop-shadow-glow w-24 h-24 md:w-36 md:h-36"
        priority
      />
      <h1 className="text-4xl md:text-7xl font-bold mb-4 md:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
        Bienvenido a BoffMedia
      </h1>
      <p className="text-lg md:text-2xl mb-6 md:mb-10 text-surface-300 max-w-3xl mx-auto">
        Sumérgete en experiencias de juego inmersivas y herramientas
        poderosas para gamers
      </p>
      <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6">
        <Link
          href="/wingull"
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-bold text-lg md:text-xl hover:from-purple-700 hover:to-pink-700 transition duration-300 inline-flex items-center justify-center shadow-neon"
        >
          Explora Pixelmon Wingull 2
          <ArrowRight className="ml-2" aria-hidden="true" />
        </Link>
        <Link
          href="/comunidad"
          className="bg-surface-800 text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-bold text-lg md:text-xl hover:bg-surface-700 transition duration-300 inline-flex items-center justify-center border-2 border-purple-500"
        >
          Únete a la Comunidad
          <ChevronRight className="ml-2" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
