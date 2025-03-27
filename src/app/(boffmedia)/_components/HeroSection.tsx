import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import { getTranslations } from "next-intl/server"

export async function HeroSection() {
  const t = await getTranslations("boffmedia");
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
              {t("hero.title.first")}
              <span className="block text-primary-400">{t("hero.title.second")}</span>
            </h1>
            <p className="text-xl text-surface-200 mb-8">
              {t("hero.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" className="bg-primary-500 hover:bg-primary-600 text-white" asChild>
                <Link href="/games">
                  {t("hero.buttons.exploreGames")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-500 text-primary-500 hover:bg-primary-500/10"
                asChild
              >
                <Link href="/community">{t("hero.buttons.joinCommunity")}</Link>
              </Button>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <Image
              src="/img/boff-full.webp"
              alt={t("hero.image.alt")}
              width={500}
              height={500}
              className="rounded-lg"
            />
            {/*
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-warning-400 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-2xl font-bold text-surface-900">{t("hero.new")}</span>
            </div>
            */}
          </div>
        </div>
      </div>
    </div>
  )
}