"use client"

import { create } from "zustand"
import type { PostType } from "../_types"

/**
 * The composer is opened from four places that share no ancestor below the shell — the
 * nav's "Trinar" CTA, the mobile FAB, the inline box at the top of the feed, and a
 * post's reply button. A store keeps the modal itself mounted once, in the shell,
 * instead of threading a callback through every screen.
 */
interface ComposeState {
  open: boolean
  type: PostType
  /** Set when composing a reply — the parent trino the composer answers. */
  replyTo: { id: number; handle: string | null } | null
  openCompose: (type?: PostType) => void
  openReply: (to: { id: number; handle: string | null }) => void
  close: () => void
}

export const useComposeStore = create<ComposeState>((set) => ({
  open: false,
  type: "text",
  replyTo: null,
  openCompose: (type = "text") => set({ open: true, type, replyTo: null }),
  openReply: (replyTo) => set({ open: true, type: "text", replyTo }),
  close: () => set({ open: false, replyTo: null }),
}))
