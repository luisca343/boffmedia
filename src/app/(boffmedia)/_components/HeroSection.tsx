import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import Image from "next/image"

export function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-surface-950">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("/img/boff.svg")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="relative h-[calc(100vh-4rem)] container mx-auto px-4 py-24 sm:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-surface-50">
              Tu aventura gaming
              <span className="block text-primary-400">comienza aquí</span>
            </h1>
            <p className="text-xl text-surface-200 mb-8">
              Sumérgete en experiencias de juego inmersivas, compite en torneos épicos y forma parte de una comunidad
              apasionada de gamers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" className="bg-primary-500 hover:bg-primary-600 text-white" asChild>
                <Link href="/games">
                  Explorar Juegos
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-500 text-primary-500 hover:bg-primary-500/10"
                asChild
              >
                <Link href="/community">Unirse a la Comunidad</Link>
              </Button>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <Image
              src="/img/boff-full.webp"
              alt="Gaming Illustration"
              width={500}
              height={500}
              className="rounded-lg"
            />
            {/*
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-warning-400 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-2xl font-bold text-surface-900">¡Nuevo!</span>
            </div>
            */}
          </div>
        </div>
      </div>
    </div>
  )
}

