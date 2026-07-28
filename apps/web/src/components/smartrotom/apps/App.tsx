"use client"
import Image from "next/image"
import { useState } from "react"
import { motion } from "framer-motion"
import { CSS } from "@dnd-kit/utilities"
import { InternalLink } from "../../ui/navigation/Link"
import { RotomApp as SmartRotomApp } from "@boffmedia/shared"

interface AppIconProps {
  app: SmartRotomApp
  size?: "small" | "normal"
  withLink?: boolean
}

function AppIcon({ app, size, withLink = true }: AppIconProps) {
  const estilos = size === "small" ? "w-16 h-16 sm:w-20 sm:h-20" : "w-24 h-24 sm:w-36 sm:h-36"
  const textSize = size === "small" ? "text-xs sm:text-sm" : "text-base sm:text-lg lg:text-xl"
  // A missing icon file degrades to a letter tile instead of a broken image.
  const [failed, setFailed] = useState(false)

  const icon = (
    <>
      <div className={estilos}>
        {failed ? (
          <div className="flex h-full w-full items-center justify-center rounded-3xl bg-white/25 text-4xl font-bold text-ink text-shadow-border2">
            {app.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <Image
            src={`/smartrotom/img/apps/${app.url}.webp`}
            alt={app.name}
            width={150}
            height={150}
            className="w-full h-full"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <p className={`text-ink text-center ${textSize} mt-2 text-shadow-border2`}>
        {app.name}
      </p>
    </>
  )

  return withLink && app.url ? (
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

  return (
    <li
      className={`flex flex-col items-center justify-center m-auto hover:cursor-pointer mb-2`}
    >
      <motion.div whileHover={{ scale: 1 }} key={app.id} className="flex flex-col items-center">
          <AppIcon app={app} size={size} withLink={true} />
        </motion.div>
    </li>
  )
}