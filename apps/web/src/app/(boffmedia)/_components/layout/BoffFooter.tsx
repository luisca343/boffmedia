import Link from "next/link"
import { Button } from "@/components/ui/primitives/button"
import { Input } from "@/components/ui/primitives/input"
import { Gamepad } from "lucide-react"
import { getTranslations } from "next-intl/server"

export async function BoffFooter() {
  const t = await getTranslations("boffmedia.footer");
  
  return (
    <footer className="border-t border-surface-700 bg-surface-800 h-72 relative">
      <div className="container mx-auto px-4 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Gamepad className="h-6 w-6 text-primary-500" />
              <span className="text-lg font-bold text-surface-50">BoffMedia</span>
            </div>
            <p className="text-sm text-surface-300">{t("tagline")}</p>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-surface-50">{t("sections.platform.title")}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/juegos"
                  className="text-surface-300 hover:text-primary-400 transition-colors"
                >
                  {t("sections.platform.links.games")}
                </Link>
              </li>
              <li>
                <Link
                  href="/eventos"
                  className="text-surface-300 hover:text-primary-400 transition-colors"
                >
                  {t("sections.platform.links.events")}
                </Link>
              </li>
              <li>
                <Link
                  href="/community"
                  className="text-surface-300 hover:text-primary-400 transition-colors"
                >
                  {t("sections.platform.links.community")}
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-surface-50">{t("sections.company.title")}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-surface-300 hover:text-primary-400 transition-colors"
                >
                  {t("sections.company.links.about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-surface-300 hover:text-primary-400 transition-colors"
                >
                  {t("sections.company.links.blog")}
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-surface-50">{t("newsletter.title")}</h4>
            <div className="flex space-x-2">
              <Input
                placeholder={t("newsletter.emailPlaceholder")}
                type="email"
                className="bg-surface-700 border-surface-600"
              />
              <Button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white">
                {t("newsletter.joinButton")}
              </Button>
            </div>
          </div>
        </div>
        <div className="border-t border-surface-700 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-surface-300">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
          <div className="flex gap-4">
            <Link
              href="/privacidad"
              className="text-sm text-surface-300 hover:text-primary-400 transition-colors"
            >
              {t("legal.privacy")}
            </Link>
            <Link
              href="/terminos"
              className="text-sm text-surface-300 hover:text-primary-400 transition-colors"
            >
              {t("legal.terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}