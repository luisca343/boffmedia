'use client'

import React, { useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useBoffSession } from "@/services/useBoffSession"

interface MenuItemProps {
  href: string
  label: string
  icon?: React.ReactNode
  description?: string
  roles?: string[]
  isExternal?: boolean
}

export interface MenuSectionProps {
  title: string
  href?: string // Add optional href for making the section title clickable
  icon?: React.ReactNode // Optional icon for the section header
  items: MenuItemProps[]
  description?: string
}

interface CustomDropdownMenuProps {
  triggerLabel: string
  mainLink?: MenuItemProps
  sections: MenuSectionProps[]
}

const MotionLink = motion(Link)

export function CustomDropdownMenu({ triggerLabel, mainLink, sections }: CustomDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { hasRole } = useBoffSession()

  const closeMenu = () => setIsOpen(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Button 
        variant="ghost" 
        className="px-2 py-1 z-20 text-primary-300 hover:text-primary-100 hover:bg-surface-800/50 text-sm group"
        onClick={() => setIsOpen(!isOpen)}
      >
        {mainLink ? (
          <Link href={mainLink.href} className="flex items-center" onClick={closeMenu}>
            {mainLink.label}
            <ChevronDown className="ml-1 h-3 w-3 opacity-50 group-hover:rotate-180 transition-transform" />
          </Link>
        ) : (
          <>
            {triggerLabel}
            <ChevronDown className="ml-1 h-3 w-3 opacity-50 group-hover:rotate-180 transition-transform" />
          </>
        )}
      </Button>
      
      {isOpen && (
        <div className="absolute pt-2 z-10 w-72 bg-surface-900 shadow-lg rounded-md overflow-hidden">
          <div className="border border-surface-800 border-t-surface-900">
            {sections.map((section, index) => (
              <React.Fragment key={section.title}>
                {index > 0 && <div className="bg-surface-800 h-px"/>}
                
                {section.title && (
                  section.href ? (
                    // Clickable section title with link
                    <Link 
                      href={section.href}
                      className="px-3 py-1 text-xs font-semibold text-amber-400/90 uppercase tracking-wider flex items-center justify-between group hover:bg-surface-800/30"
                      onClick={closeMenu}
                    >
                      <span className="flex items-center gap-2">
                        {section.icon && <span className="text-amber-400/90">{section.icon}</span>}
                        {section.title}
                      </span>
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ) : (
                    // Non-clickable section title
                    <h3 className="px-3 py-1 text-xs font-semibold text-amber-400/90 uppercase tracking-wider flex items-center gap-2">
                      {section.icon && <span>{section.icon}</span>}
                      {section.title}
                    </h3>
                  )
                )}
                
                <div className="space-y-0.5">
                  {section.items
                    .filter(item => !item.roles || hasRole(item.roles))
                    .map((item, itemIndex) => (
                      <MotionLink
                        href={item.href}
                        className="px-3 py-1 text-sm text-primary-200 hover:text-primary-100 hover:bg-surface-800/50 flex items-center justify-between group"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: itemIndex * 0.03 }}
                        key={item.href}
                        onClick={closeMenu}
                        target={item.isExternal ? "_blank" : undefined}
                        rel={item.isExternal ? "noopener noreferrer" : undefined}
                      >
                        <span className="flex items-center gap-2">
                          {item.icon && <span className="text-primary-400 text-sm">{item.icon}</span>}
                          {item.label}
                        </span>
                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </MotionLink>
                    ))}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}