'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import dynamic from 'next/dynamic'

const NotificationPopover = dynamic(() => import('./NotificationPopover'), { ssr: false })
const UserAuthSection = dynamic(() => import('./UserAuthSection'), { ssr: false })

const HIDDEN_APPS = ["smartrotom", "battlesim", "ciclosimitacion"]
const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/herramientas", label: "Herramientas" },
  { href: "/wingull", label: "Pixelmon Wingull" },
  { href: "/smartrotom", label: "SmartRotom" },
]

export default function OptimizedFicusNav() {
  const pathname = usePathname()
  const [currentApp, setCurrentApp] = useState<string | null>(null)

  useEffect(() => {
    const app = pathname.split("/")[1] || "boffmedia"
    setCurrentApp(app || null)
  }, [pathname])

  if (!currentApp || HIDDEN_APPS.includes(currentApp)) {
    return null
  }

  function inPage(href: string) {
    return (pathname.startsWith(href) && href !== "/") || pathname === href
  }

  return (
    <nav className="bg-gray-900 p-4 shadow-lg" aria-label="Navegación Principal">
      <div className="container mx-auto flex justify-between items-center">
        <ul className="flex flex-wrap justify-start items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`text-orange-300 hover:text-orange-100 transition-colors duration-200 ease-in-out relative group flex items-center ${
                  inPage(href) ? "font-medium" : ""
                }`}
              >
                <span className="relative z-10">{label}</span>
                <span
                  className={`absolute left-0 right-0 bottom-0 h-0.5 bg-gradient-to-r from-orange-400 to-orange-600 transform ${
                    inPage(href) ? "scale-x-100" : "scale-x-0"
                  } group-hover:scale-x-100 transition-transform duration-200 ease-in-out`}
                  aria-hidden="true"
                ></span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4">
          <NotificationPopover />
          <UserAuthSection />
        </div>
      </div>
    </nav>
  )
}