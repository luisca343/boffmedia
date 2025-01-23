"use client"
import Image from "next/image"
import { motion } from "framer-motion"
import { CSS } from "@dnd-kit/utilities"
import { InternalLink } from "../nav/Link"
import type { OrderedApp } from "@/types/apps"
import { useSortable } from "@dnd-kit/sortable"

function AppIcon({ app, estilos }: { app: OrderedApp; estilos: string }) {
  return (
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
      <p className="text-surface-50 text-center text-base sm:text-lg lg:text-xl mt-2 text-shadow-surface-border2">
        {app.name}
      </p>
    </>
  )
}

export function App({ app }: { app: OrderedApp }) {
  const { attributes, listeners, setNodeRef, transform, transition, active, isDragging } = useSortable({ id: app.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const estilos = `w-24 h-24 sm:w-36 sm:h-36 ${isDragging ? "opacity-50" : ""}`

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex flex-col items-center justify-center m-auto hover:cursor-pointer mb-2"
    >
      {active ? (
        <motion.div whileHover={{ scale: 1 }} key={app.id} className="flex flex-col items-center">
          <AppIcon app={app} estilos={estilos} />
        </motion.div>
      ) : (
        <motion.div whileHover={{ scale: 1.1 }} key={app.id} className="flex flex-col items-center">
          <InternalLink href={app.url} className="flex flex-col items-center">
            <AppIcon app={app} estilos={estilos} />
          </InternalLink>
        </motion.div>
      )}
    </li>
  )
}

