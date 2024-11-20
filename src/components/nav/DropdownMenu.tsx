import * as React from "react"
import Link from "next/link"
import { ChevronDown } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface MenuItemProps {
  href: string
  label: string
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

export function CustomDropdownMenu({ triggerLabel, mainLink, sections }: CustomDropdownMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="pr-0 pl-2 py-2 text-primary-300 hover:text-primary-100 hover:bg-surface-800/50 transition-all duration-200 text-base"
        >
          {mainLink ? (
            <Link href={mainLink.href} className="flex items-center gap-2">
              {mainLink.label}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Link>
          ) : (
            <>
              {triggerLabel}
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="mt-2 w-64 bg-surface-800/95 backdrop-blur-sm border border-surface-700 border-t-surface-800 shadow-xl shadow-surface-800/20"
        align="start"
      >
        {sections.map((section, index) => (
          <React.Fragment key={section.title}>
            {index > 0 && <DropdownMenuSeparator className="bg-surface-700" />}
            <h3 className="px-3 py-2 text-base font-medium text-amber-400/90">{section.title}</h3>
            {section.items.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link
                  href={item.href}
                  className="px-3 py-2 text-base text-primary-200 hover:text-primary-100 hover:bg-surface-700/50 cursor-pointer transition-colors duration-200 focus:bg-surface-700/70 focus:text-primary-100"
                >
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}