"use client"

import { useForumPresence } from "@/hooks/forum/useForumPresence"

// Headless: pings presence while any /foro page is mounted (see the hook).
export function ForumPresence() {
  useForumPresence()
  return null
}
