"use client"

import * as React from "react"
import { ToolCard } from "./tool-card"
import { FavStar } from "./fav-star"
import { useRecent } from "./tools-store"

interface ToolCardFavTool {
  title: string
  desc: string
  icon: string
  features: string[]
  href: string
  popularity?: string
  soon?: boolean
  isNew?: boolean
}

interface ToolCardFavProps {
  tool: ToolCardFavTool
  go: (path: string) => void
  delay?: number
  className?: string
}

export function ToolCardFav({ tool, go, delay, className = "" }: ToolCardFavProps) {
  const { push } = useRecent()

  const wrapGo = (path: string) => {
    push(tool.href)
    go(path)
  }

  return (
    <div className={"relative " + className}>
      <ToolCard tool={tool} go={wrapGo} delay={delay} />
      <FavStar href={tool.href} className="absolute top-[1.1rem] right-[1.1rem] z-[3]" />
    </div>
  )
}
