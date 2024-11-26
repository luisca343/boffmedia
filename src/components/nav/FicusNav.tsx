'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import dynamic from 'next/dynamic'
import { Home, Menu, X } from 'lucide-react'
import { HerramientasMenu } from "./ToolsMenu"
import { WingullMenu } from "./WingullMenu"
import { InternalLink } from "./Link"

const NotificationPopover = dynamic(() => import('./NotificationPopover'), { 
  ssr: false,
  loading: () => <div className="w-8 h-8 bg-surface-800 rounded-full animate-pulse" />
})

const UserAuthSection = dynamic(() => import('./UserAuthSection'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-surface-800 rounded-full animate-pulse" />
      <div className="w-16 h-4 bg-surface-800 rounded animate-pulse" />
    </div>
  )
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

  useEffect(() => {
    const app = pathname.split("/")[1] || "boffmedia"
    const subdomain = window.location.host.split('.')[0];
    setCurrentApp(app || null)
    setSubdomain(subdomain)
    setMounted(true)
  }, [pathname])

  function inPage(href: string) {
    return (pathname.startsWith(href) && href !== "/") || pathname === href
  }

  //if(currentApp && HIDDEN_APPS.includes(currentApp) || subdomain && HIDDEN_APPS.includes(subdomain)) return <div className="-mb-16" />

  return (
    <nav 
      className="bg-surface-800 border-b border-surface-700 shadow-lg fixed w-full z-20 h-16"
      aria-label="Navegación Principal"
    >
      <div className="container mx-auto flex justify-between items-center h-full px-4">
        <button
          className="lg:hidden text-primary-300 hover:text-primary-100"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <ul className={`lg:flex flex-wrap justify-start items-center gap-6 ${isMenuOpen ? 'flex flex-col absolute top-16 left-0 w-full bg-surface-800 p-4 space-y-4' : 'hidden'}`}>
          {NAV_LINKS.map(({ href, label, icon, override }) => (
            <li key={href} className={isMenuOpen ? 'w-full' : ''}>
              {override ? (
                override
              ) : (
                <InternalLink
                  href={href}
                  className={`text-primary-300 hover:text-primary-100 transition-colors duration-200 ease-in-out relative group flex items-center gap-2 ${
                    inPage(href) ? "font-medium" : ""
                  } ${isMenuOpen ? 'w-full' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
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
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4">
          {mounted && currentApp && !HIDDEN_APPS.includes(currentApp) ? (
            <>
              <NotificationPopover />
              <UserAuthSection />
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-surface-800 rounded-full animate-pulse" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-surface-800 rounded-full animate-pulse" />
                <div className="w-16 h-4 bg-surface-800 rounded animate-pulse" />
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

