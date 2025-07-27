import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import { getTranslations } from "next-intl/server"

export async function HeroSection() {
  const t = await getTranslations("boffmedia");
  return (
    <div className="relative overflow-hidden bg-surface-950">
      
      {/* Bottom SVG Wave */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden opacity-100 z-10">
        <svg className="relative block w-full h-20" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V120H0Z" className="fill-surface-700" opacity="1"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V120H0Z" className="fill-surface-800"></path>
        </svg>
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("/img/boff.svg")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="relative h-[105vh] container mx-auto px-4 py-24 sm:py-32">
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
          </div>
        </div>
      </div>
    </div>
  )
}