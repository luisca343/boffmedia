"use client"

import { useEffect, useState } from "react"
import { connectTwitchChat, type ChatMsg, type ChatStatus } from "../_services/twitchChat"

/** Live message buffer for a channel's Twitch chat (anonymous read). */
export function useTwitchChat(channel: string, max = 200) {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [status, setStatus] = useState<ChatStatus>("connecting")

  useEffect(() => {
    if (!channel) return
    setMessages([])
    setStatus("connecting")
    const disconnect = connectTwitchChat(
      channel,
      (m) => setMessages((prev) => [...prev.slice(-(max - 1)), m]),
      setStatus,
    )
    return disconnect
  }, [channel, max])

  return { messages, status }
}
