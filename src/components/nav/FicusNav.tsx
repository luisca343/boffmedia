'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import dynamic from 'next/dynamic'
import { HerramientasMenu } from "./ToolsMenu"
import { WingullMenu } from "./WingullMenu"

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

const HIDDEN_APPS = ["smartrotom", "battlesim", "ciclosimitacion"]
const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/herramientas", label: "Herramientas", override: <HerramientasMenu /> },
  { href: "/wingull", label: "Pixelmon Wingull", override: <WingullMenu /> },
]

export default function OptimizedFicusNav() {
  const pathname = usePathname()
  const [currentApp, setCurrentApp] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const app = pathname.split("/")[1] || "boffmedia"
    setCurrentApp(app || null)
    setMounted(true)
  }, [pathname])

  function inPage(href: string) {
    return (pathname.startsWith(href) && href !== "/") || pathname === href
  }

  if(currentApp && HIDDEN_APPS.includes(currentApp)) return <div className="-mb-16" />

  return (
    <nav className="bg-surface-800 border border-b-surface-700 p-4 shadow-lg fixed w-full z-20 h-16" aria-label="Navegación Principal">
      <div className="container mx-auto flex justify-between items-center h-full">
        <ul className="flex flex-wrap justify-start items-center gap-6">
          {NAV_LINKS.map(({ href, label, override }) => (
            <li key={href}>
              {override ? (
                override
              ) : (
                <Link
                  href={href}
                  className={`text-primary-300 hover:text-primary-100 transition-colors duration-200 ease-in-out relative group flex items-center ${
                    inPage(href) ? "font-medium" : ""
                  }`}
                >
                  <span className="relative z-10">{label}</span>
                  <span
                    className={`absolute left-0 right-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-400 to-primary-600 transform ${
                      inPage(href) ? "scale-x-100" : "scale-x-0"
                    } group-hover:scale-x-100 transition-transform duration-200 ease-in-out`}
                    aria-hidden="true"
                  ></span>
                </Link>
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