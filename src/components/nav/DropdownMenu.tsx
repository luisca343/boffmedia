'use client'

import React, { useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface MenuItemProps {
  href: string
  label: string
  icon?: React.ReactNode
}

interface MenuSectionProps {
  title: string
  items: MenuItemProps[]
}

interface CustomDropdownMenuProps {
  triggerLabel: string
  mainLink?: MenuItemProps
  sections: MenuSectionProps[]
}

const MotionLink = motion(Link)

export function CustomDropdownMenu({ triggerLabel, mainLink, sections }: CustomDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const closeMenu = () => {
    setIsOpen(false)
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Button 
        variant="ghost" 
        className="pr-0 pl-2 py-2 z-20 text-primary-300 hover:text-primary-100 hover:bg-surface-800/50 transition-all duration-200 text-base group"
        onClick={() => setIsOpen(!isOpen)}
      >
        {mainLink ? (
          <Link href={mainLink.href} className="flex items-center gap-2" onClick={closeMenu}>
            {mainLink.label}
            <ChevronDown className="h-4 w-4 opacity-50 group-hover:rotate-180 transition-transform duration-200" />
          </Link>
        ) : (
          <>
            {triggerLabel}
            <ChevronDown className="ml-2 h-4 w-4 opacity-50 group-hover:rotate-180 transition-transform duration-200" />
          </>
        )}
      </Button>
      {isOpen && (
        <div 
          className="absolute pt-3 z-10 w-96 bg-surface-800 backdrop-blur-sm shadow-xl shadow-surface-800/20 rounded-lg overflow-hidden"
        >
          <div className="border border-surface-700 border-t-surface-800">
          {sections.map((section, index) => (
            <React.Fragment key={section.title}>
              {index > 0 && <div className="bg-surface-700 h-[1px]"/>}
              <h3 className="px-4 py-2 text-sm font-semibold text-amber-400/90 uppercase tracking-wider">{section.title}</h3>
              {section.items.map((item, itemIndex) => (
                <MotionLink
                  href={item.href}
                  className="px-4 py-2 text-base text-primary-200 hover:text-primary-100 hover:bg-surface-700/50 cursor-pointer transition-colors duration-200 focus:bg-surface-700/70 focus:text-primary-100 flex items-center justify-between group"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: itemIndex * 0.05 }}
                  key={item.href}
                  onClick={closeMenu}
                >
                  <span className="flex items-center gap-3">
                    {item.icon && <span className="text-primary-400">{item.icon}</span>}
                    {item.label}
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </MotionLink>
              ))}
            </React.Fragment>
          ))}
        </div>
        </div>
      )}
    </div>
  )
}

