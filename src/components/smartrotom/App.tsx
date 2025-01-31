"use client"
import Image from "next/image"
import { motion } from "framer-motion"
import { CSS } from "@dnd-kit/utilities"
import { InternalLink } from "../nav/Link"
import type { OrderedApp } from "@/types/apps"
import { useSortable } from "@dnd-kit/sortable"

interface AppIconProps {
  app: OrderedApp
  size?: "small" | "normal"
  withLink?: boolean
}

function AppIcon({ app, size, withLink = true }: AppIconProps) {
  const estilos = size === "small" ? "w-16 h-16 sm:w-20 sm:h-20" : "w-24 h-24 sm:w-36 sm:h-36"
  const textSize = size === "small" ? "text-xs sm:text-sm" : "text-base sm:text-lg lg:text-xl"

  const icon = (
    <>
      <div className={estilos}>
        <Image
          src={`/smartrotom/img/apps/${app.url}.webp`}
          alt={app.name}
          width={150}
          height={150}
          className="w-full h-full"
        />
      </div>
      <p className={`text-surface-50 text-center ${textSize} mt-2 text-shadow-surface-border2`}>
        {app.name}
      </p>
    </>
  )

  return withLink ? (
    <InternalLink href={app.url} className="flex flex-col items-center">
      {icon}
    </InternalLink>
  ) : (
    <div className="flex flex-col items-center">
      {icon}
    </div>
  )
}

export function App({ app, size = "normal", withLink = true }: AppIconProps) {
  const { attributes, listeners, setNodeRef, transform, transition, active, isDragging } = useSortable({ id: app.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex flex-col items-center justify-center m-auto hover:cursor-pointer mb-2 ${isDragging ? "opacity-50" : ""}`}
    >
      {active ? (
        <motion.div whileHover={{ scale: 1 }} key={app.id} className="flex flex-col items-center">
          <AppIcon app={app} size={size} withLink={false} />
        </motion.div>
      ) : (
        <motion.div whileHover={{ scale: 1.1 }} key={app.id} className="flex flex-col items-center">
          <AppIcon app={app} size={size} withLink={withLink} />
        </motion.div>
      )}
    </li>
  )
}