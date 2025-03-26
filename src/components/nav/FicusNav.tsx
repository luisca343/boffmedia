"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import dynamic from "next/dynamic"
import { Home, Menu } from "lucide-react"
import { useLocale } from "next-intl"
import { HerramientasMenu } from "./ToolsMenu"
import { WingullMenu } from "./WingullMenu"
import { InternalLink } from "./Link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import LanguageSwitcher from "./LanguageSwitcher"

const NotificationPopover = dynamic(() => import("./NotificationPopover"), {
  ssr: false,
  loading: () => <div className="w-8 h-8 bg-surface-700 rounded-full animate-pulse" />,
})

const UserAuthSection = dynamic(() => import("./UserAuthSection"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-surface-700 rounded-full animate-pulse" />
      <div className="w-16 h-4 bg-surface-700 rounded animate-pulse" />
    </div>
  ),
})

const HIDDEN_APPS = ["smartrotom", "battlesim", "ciclosimitacion", "blog", "forum"]
const NAV_LINKS = [
  { href: "/", label: "Inicio", icon: <Home className="h-5 w-5" /> },
  { href: "/herramientas", label: "Herramientas", override: <HerramientasMenu /> },
  { href: "/wingull", label: "Pixelmon Wingull", override: <WingullMenu /> },
]

export default function OptimizedFicusNav() {
  const pathname = usePathname()
  const [currentApp, setCurrentApp] = useState<string | null>(null)
  const [subdomain, setSubdomain] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const locale = useLocale()

  useEffect(() => {
    const app = pathname.split("/")[1] || "boffmedia"
    const subdomain = window.location.host.split(".")[0]
    setCurrentApp(app || null)
    setSubdomain(subdomain)
    setMounted(true)
  }, [pathname])

  const inPage = useCallback(
    (href: string) => {
      return (pathname.startsWith(href) && href !== "/") || pathname === href
    },
    [pathname],
  )

  const handleMenuItemClick = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  return (
    <nav
      className="bg-surface-900 border-b border-surface-700 shadow-lg fixed w-full z-20 h-16"
      aria-label="Navegación Principal"
    >
      <div className="container mx-auto flex justify-between items-center h-full px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 text-transparent bg-clip-text">
            BoffMedia
          </span>
        </Link>
        <div className="hidden md:flex items-center space-x-6">
          {NAV_LINKS.map(({ href, label, icon, override }) => (
            <div key={href}>
              {override ? (
                override
              ) : (
                <InternalLink
                  app={href === "/" ? "" : null}
                  href={href}
                  className={`text-surface-300 hover:text-primary-400 transition-colors duration-200 ease-in-out relative group flex items-center gap-2 ${
                    inPage(href) ? "font-medium text-primary-400" : ""
                  }`}
                  onClick={handleMenuItemClick}
                >
                  {icon && <span className="text-primary-400">{icon}</span>}
                  <span className="relative z-10">{label}</span>
                  <span
                    className={`absolute left-0 right-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-400 to-primary-600 transform ${
                      inPage(href) ? "scale-x-100" : "scale-x-0"
                    } group-hover:scale-x-100 transition-transform duration-200 ease-in-out`}
                    aria-hidden="true"
                  ></span>
                </InternalLink>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {mounted && currentApp && !HIDDEN_APPS.includes(currentApp) ? (
            <>
              <LanguageSwitcher />
              <NotificationPopover />
              <UserAuthSection />
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-surface-700 rounded-full animate-pulse" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-surface-700 rounded-full animate-pulse" />
                <div className="w-16 h-4 bg-surface-700 rounded animate-pulse" />
              </div>
            </>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-surface-900">
              <nav className="flex flex-col gap-4">
                {/* Language switcher with mobile variant */}
                <LanguageSwitcher variant="mobile" />
                
                {NAV_LINKS.map(({ href, label, icon, override }) => (
                  <div key={href}>
                    {override ? (
                      override
                    ) : (
                      <InternalLink
                        app={href === "/" ? "" : null}
                        href={href}
                        className={`text-surface-300 hover:text-primary-400 transition-colors duration-200 ease-in-out flex items-center gap-2 ${
                          inPage(href) ? "font-medium text-primary-400" : ""
                        }`}
                        onClick={handleMenuItemClick}
                      >
                        {icon && <span className="text-primary-400">{icon}</span>}
                        <span>{label}</span>
                      </InternalLink>
                    )}
                  </div>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}