'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const HIDDEN_APPS = ['smartrotom', 'battlesim']
const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/herramientas', label: 'Herramientas' },
  { href: '/wingull', label: 'Pixelmon Wingull' },
  { href: '/smartrotom', label: 'SmartRotom' },
]

export function FicusNav() {
  const pathname = usePathname()
  const [currentApp, setCurrentApp] = useState<string | null>(null)

  useEffect(() => {
    const app = pathname.split('/')[1] || "boffmedia"
    setCurrentApp(app || null)
  }, [pathname])

  if (!currentApp || HIDDEN_APPS.includes(currentApp)) {
    return null
  }

  function inPage(href: string) {
    return pathname.startsWith(href) && href !== '/' || pathname === href
  }

  return (
    <nav className="bg-gray-800 p-4 shadow-lg" aria-label="Main Navigation">
      <div className="container mx-auto">
        <ul className="flex flex-wrap justify-start items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`text-gray-300 hover:text-white transition-colors duration-200 ease-in-out relative group ${
                  inPage(href) ? 'font-medium' : ''
                }`}
              >
                {label}
                <span
                  className={`absolute left-0 right-0 bottom-0 h-0.5 bg-blue-500 transform ${
                    inPage(href) ? 'scale-x-100' : 'scale-x-0'
                  } group-hover:scale-x-100 transition-transform duration-200 ease-in-out`}
                ></span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}