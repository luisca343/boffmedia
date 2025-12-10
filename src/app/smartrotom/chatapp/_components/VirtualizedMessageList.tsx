"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Message } from "./Message"
import type { Message as MessageType } from "../_types/Chat"
import { Loader2 } from "lucide-react"

interface VirtualizedMessageListProps {
  messages: MessageType[]
  session: any
  isGroup: boolean
  isLoadingMore: boolean
  hasMoreMessages: boolean
  onLoadMore: () => void
  typingUsers?: Set<string>
  scrollRef?: React.RefObject<HTMLDivElement | null>
}

const BUFFER_SIZE = 10 // Number of messages to render outside viewport
const ESTIMATED_MESSAGE_HEIGHT = 80 // Estimated height in pixels

export function VirtualizedMessageList({
  messages,
  session,
  isGroup,
  isLoadingMore,
  hasMoreMessages,
  onLoadMore,
  typingUsers,
  scrollRef
}: VirtualizedMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: Math.min(50, messages.length) })
  const messagesStartRef = useRef<HTMLDivElement>(null)

  // Calculate which messages should be visible based on scroll position
  const updateVisibleRange = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    
    // Since we use flex-col-reverse, calculate from bottom
    const scrollBottom = scrollHeight - scrollTop - clientHeight
    
    // Calculate visible indices (messages array is already in correct order for display)
    const startIndex = Math.max(0, Math.floor(scrollBottom / ESTIMATED_MESSAGE_HEIGHT) - BUFFER_SIZE)
    const endIndex = Math.min(
      messages.length,
      Math.ceil((scrollBottom + clientHeight) / ESTIMATED_MESSAGE_HEIGHT) + BUFFER_SIZE
    )

    setVisibleRange({ start: startIndex, end: endIndex })

    // Check if need to load more (scrolled to top)
    if (scrollBottom < 200 && !isLoadingMore && hasMoreMessages) {
      onLoadMore()
    }
  }, [messages.length, isLoadingMore, hasMoreMessages, onLoadMore])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    updateVisibleRange()
    
    const handleScroll = () => {
      updateVisibleRange()
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [updateVisibleRange])

  // Update visible range when messages change
  useEffect(() => {
    updateVisibleRange()
  }, [messages.length, updateVisibleRange])

  const scrollToBottom = () => {
    messagesStartRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // For better performance, only render visible messages
  const visibleMessages = messages.slice(visibleRange.start, visibleRange.end)
  
  // Calculate spacer heights to maintain scroll position
  const topSpacerHeight = visibleRange.start * ESTIMATED_MESSAGE_HEIGHT
  const bottomSpacerHeight = (messages.length - visibleRange.end) * ESTIMATED_MESSAGE_HEIGHT

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 flex flex-col-reverse"
      style={{
        backgroundImage: "url('/smartrotom/img/fondoChat2.avif')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div ref={messagesStartRef} />
      
      {/* Bottom spacer for messages below viewport */}
      {bottomSpacerHeight > 0 && (
        <div style={{ height: `${bottomSpacerHeight}px`, flexShrink: 0 }} />
      )}
      
      {/* Render visible messages */}
      {visibleMessages.map((message, index) => {
        const actualIndex = visibleRange.start + index
        return (
          <Message
            key={message.id}
            message={message}
            session={session}
            img={isGroup}
            prev={actualIndex < messages.length - 1 ? messages[actualIndex + 1] : null}
            next={actualIndex > 0 ? messages[actualIndex - 1] : null}
          />
        )
      })}
      
      {/* Top spacer for messages above viewport */}
      {topSpacerHeight > 0 && (
        <div style={{ height: `${topSpacerHeight}px`, flexShrink: 0 }} />
      )}
      
      {/* Loading indicator */}
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      )}
      
      {/* Typing indicator */}
      {typingUsers && typingUsers.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-400">
          <div className="flex gap-1">
            <span className="animate-bounce" style={{ animationDelay: "0ms" }}>•</span>
            <span className="animate-bounce" style={{ animationDelay: "150ms" }}>•</span>
            <span className="animate-bounce" style={{ animationDelay: "300ms" }}>•</span>
          </div>
          <span>
            {typingUsers.size === 1 ? "Someone is" : `${typingUsers.size} people are`} typing...
          </span>
        </div>
      )}
    </div>
  )
}
