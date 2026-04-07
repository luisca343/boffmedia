"use client"

import { Message } from "./messages/Message"
import { toast } from "react-toastify"
import type { ChatData, Message as MessageType, ImageMessageData } from "../_types/Chat"
import { Phone, Send, X } from "lucide-react"
import { Input } from "@/components/ui/primitives/input"
import { AttachmentMenu } from "./pickers/AttachmentMenu"
import { EmojiStickerMenu } from "./pickers/EmojiStickerMenu"
import type { Screenshot } from "@/stores/cameraGalleryStore"
import { getSmartRotomUser } from "@/lib/utils"
import { Button } from "@/components/ui/primitives/button"
import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { useBoffSession } from "@/services/useBoffSession"
import { ChatAppService } from "@/services/api/smartrotom/chatAppService"
import { CreateMessageDto } from "@boffmedia/shared"
import useSocketStore from "@/stores/useSocketStore"

export function Chat({
  chats,
  activeChat,
  setActiveChat,
  onMessageSent,
  typingUsers,
}: {
  chats: ChatData[]
  activeChat: number
  setActiveChat: (id: number) => void
  onMessageSent?: (message: MessageType, activeChat: number) => void
  typingUsers?: Map<string, string>
}) {
  const [chat, setChat] = useState(chats[0] as ChatData)
  const [message, setMessage] = useState("")
  const { socket } = useSocketStore()
  const { session } = useBoffSession()

  const messagesStartRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get usernames for typing users
  const getTypingUsernames = useCallback(() => {
    if (!typingUsers || typingUsers.size === 0) return [];
    
    const currentUserUuid = getSmartRotomUser(session).uuid;
    const usernames: string[] = [];
    
    typingUsers.forEach((username, uuid) => {
      if (uuid !== currentUserUuid) {
        usernames.push(username);
      }
    });
    
    return usernames;
  }, [typingUsers, session]);

  const scrollToBottom = () => {
    messagesStartRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chat.messages, chat]) // Added chat to dependencies

  useEffect(() => {
    const chat = chats.find((chat) => chat.id === activeChat)
    if (!chat) return
    setChat(chat)

    if (socket) {
      // Socket logic here if needed
    }
  }, [activeChat, chats, socket])

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!socket || !chat) return
    
    const userData = { chatId: chat.id, uuid: getSmartRotomUser(session).uuid, username: getSmartRotomUser(session).username };
    console.log("handleTyping called with userData:", userData);

    // Emit typing start
    console.log("Emitting chat:typing:start", userData);
    socket.emit("chat:typing:start", userData);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set timeout to emit typing stop
    typingTimeoutRef.current = setTimeout(() => {
      console.log("Emitting chat:typing:stop", userData);
      socket.emit("chat:typing:stop", userData);
    }, 2000)
  }, [socket, chat, session])

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  function isEmojiOnly(text: string): boolean {
    const trimmed = text.trim()
    if (trimmed.length === 0) return false
    
    // More precise emoji regex that excludes text and numbers
    // \p{Emoji_Presentation} matches only characters that are explicitly emoji presentation
    // We also need to exclude common non-emoji characters like digits and punctuation
    const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu
    
    // Extract all emojis
    const emojis = trimmed.match(emojiRegex)
    if (!emojis || emojis.length === 0) return false
    
    // Remove emojis and check if anything remains (letters, numbers, etc.)
    const textWithoutEmojis = trimmed.replace(emojiRegex, '').replace(/[\u200d\ufe0f\s]/g, '').trim()
    
    // If nothing remains after removing emojis, it's emoji-only
    return textWithoutEmojis.length === 0
  }

  function extractYouTubeId(url: string): string | null {
    // Match various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/,
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    return null
  }

  function isYouTubeUrl(text: string): boolean {
    const trimmed = text.trim()
    return /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)/.test(trimmed)
  }

  function sendMessage() {
    if (!message.trim()) {
      return
    }

    // Check if message is a YouTube URL
    if (isYouTubeUrl(message)) {
      const videoId = extractYouTubeId(message)
      if (videoId) {
        const videoData = {
          videoId,
          url: message.trim(),
          title: "YouTube Video"
        }

        const newMessage: MessageType = {
          id: Date.now(),
          content: JSON.stringify(videoData),
          createdAt: new Date().toISOString(),
          uuid: getSmartRotomUser(session).uuid,
          chatId: chat.id,
          type: "video"
        }

        // Update parent chats list
        onMessageSent?.(newMessage, activeChat)

        ChatAppService
          .createMessage(chat.id, {
            message: JSON.stringify(videoData),
            uuid: getSmartRotomUser(session).uuid,
            type: CreateMessageDto.type.VIDEO,
          })
          .then(() => {
            setMessage("")
          })
          .catch((error) => {
            console.error("Failed to send video message:", error)
            toast.error("Failed to send video. Please try again.")
          })
        return
      }
    }

    const messageType = isEmojiOnly(message) ? "emoji" : "text"
    

    const newMessage: MessageType = {
      id: Date.now(), // Temporary ID
      content: message,
      createdAt: new Date().toISOString(),
      uuid: getSmartRotomUser(session).uuid,
      chatId: chat.id,
      type: messageType
    }

    // Update parent chats list
    onMessageSent?.(newMessage, activeChat)

    ChatAppService
      .createMessage(chat.id, {
        message: message,
        uuid: getSmartRotomUser(session).uuid,
        type: messageType === "emoji" ? CreateMessageDto.type.EMOJI : CreateMessageDto.type.TEXT,
      })
      .then(() => {
        setMessage("")
      })
      .catch((error) => {
        console.error("Failed to send message:", error)
        toast.error("Failed to send message. Please try again.")
      })
  }

  function sendImage(screenshot: any, caption?: string) {
    // Format the image data to match the database structure
    const imageData = {
      imageUrl: screenshot.image, // The base64 or URL
      meta: {
        id: screenshot.id,
        timestamp: screenshot.timestamp,
        location: screenshot.location,
        entities: screenshot.entities,
        ...(caption ? { caption } : {})
      }
    }

    const newMessage: MessageType = {
      id: Date.now(),
      content: JSON.stringify(imageData),
      createdAt: new Date().toISOString(),
      uuid: getSmartRotomUser(session).uuid,
      chatId: chat.id,
      type: "image"
    }

    // Update parent chats list
    onMessageSent?.(newMessage, activeChat)

    // Send to backend with the original format it expects
    const backendImageData: any = { caption, screenshot }
    ChatAppService
      .createMessage(chat.id, {
        message: JSON.stringify(backendImageData),
        uuid: getSmartRotomUser(session).uuid,
        type: CreateMessageDto.type.IMAGE,
      })
      .then(() => {
        console.log("Image message sent successfully")
      })
      .catch((error) => {
        console.error("Failed to send image message:", error)
        toast.error("Failed to send image. Please try again.")
      })
  }

  function call() {
    ChatAppService.initiateCall(chat.id, { chatId: chat.id, uuid: getSmartRotomUser(session).uuid }).then((res) => {
      if (res.error) return toast.error(res.error)
    })
  }

  function handleEmojiSelect(emoji: string) {
    setMessage((prev) => prev + emoji)
    inputRef.current?.focus()
  }

  function sendSticker(stickerPath: string) {
    const newMessage: MessageType = {
      id: Date.now(),
      content: stickerPath,
      createdAt: new Date().toISOString(),
      uuid: getSmartRotomUser(session).uuid,
      chatId: chat.id,
      type: "sticker"
    }

    // Update parent chats list
    onMessageSent?.(newMessage, activeChat)

    ChatAppService
      .createMessage(chat.id, {
        message: stickerPath,
        uuid: getSmartRotomUser(session).uuid,
        type: CreateMessageDto.type.STICKER,
      })
      .then(() => {
        console.log("Sticker sent successfully")
      })
      .catch((error) => {
        console.error("Failed to send sticker:", error)
        toast.error("Failed to send sticker. Please try again.")
      })
  }

  function sendWaypoint(waypoint: { name: string; x: number; y: number; z: number; dimension?: string; color?: string }) {
    const waypointData = {
      name: waypoint.name,
      x: waypoint.x,
      y: waypoint.y,
      z: waypoint.z,
      dimension: waypoint.dimension,
      color: waypoint.color
    }

    const newMessage: MessageType = {
      id: Date.now(),
      content: JSON.stringify(waypointData),
      createdAt: new Date().toISOString(),
      uuid: getSmartRotomUser(session).uuid,
      chatId: chat.id,
      type: "waypoint"
    }

    // Update parent chats list
    onMessageSent?.(newMessage, activeChat)

    ChatAppService
      .createMessage(chat.id, {
        message: JSON.stringify(waypointData),
        uuid: getSmartRotomUser(session).uuid,
        type: CreateMessageDto.type.WAYPOINT,
      })
      .then(() => {
        console.log("Waypoint sent successfully")
      })
      .catch((error) => {
        console.error("Failed to send waypoint:", error)
        toast.error("Failed to send waypoint. Please try again.")
      });
  }

  function sendDocument(document: { id: string; title: string; content: string }) {
    const documentData = {
      documentId: parseInt(document.id),
      title: document.title,
      content: document.content
    }

    const newMessage: MessageType = {
      id: Date.now(),
      content: JSON.stringify(documentData),
      createdAt: new Date().toISOString(),
      uuid: getSmartRotomUser(session).uuid,
      chatId: chat.id,
      type: "document"
    }

    // Update parent chats list
    onMessageSent?.(newMessage, activeChat)

    ChatAppService
      .createMessage(chat.id, {
        message: JSON.stringify(documentData),
        uuid: getSmartRotomUser(session).uuid,
        type: CreateMessageDto.type.DOCUMENT,
      })
      .then(() => {
        console.log("Document sent successfully")
        toast.success(`Documento "${document.title}" compartido`)
      })
      .catch((error) => {
        console.error("Failed to send document:", error)
        toast.error("Failed to send document. Please try again.")
      });
  }

  // Memoize messages to prevent re-rendering on every keystroke
  const renderedMessages = useMemo(() => {
    return chat.messages.map((message, index) => (
      <Message
        key={message.id}
        message={message}
        session={session}
        img={chat.type !== 1}
        prev={index < chat.messages.length - 1 ? chat.messages[index + 1] : null}
        next={index > 0 ? chat.messages[index - 1] : null}
      />
    ));
  }, [chat.messages, chat.type, session]);

  return (
    <div className="flex flex-col w-full h-full">
      <div className="h-16 px-4 w-full bg-neutral-800 flex items-center border-b border-neutral-900 shadow-sm">
        <img
          src={chat.image || "/placeholder.svg"}
          className="rounded-full object-cover"
          width="40"
          height="40"
          alt={chat.name}
        />
        <div className="ml-3 font-semibold text-neutral-50">{chat.name}</div>
        <Button variant="ghost" size="icon" className="ml-auto bg-inherit" onClick={() => call()}>
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="bg-inherit" onClick={() => setActiveChat(0)}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div
        className="flex-1 overflow-y-auto p-4 flex flex-col-reverse"
        style={{
          backgroundImage: "url('/smartrotom/img/fondoChat2.avif')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div ref={messagesStartRef} />
        {(() => {
          const typingUsernames = getTypingUsernames();
          
          if (typingUsernames.length === 0) return null;
          
          const displayText = (() => {
            if (typingUsernames.length === 1) {
              return `${typingUsernames[0]} is typing`;
            } else if (typingUsernames.length === 2) {
              return `${typingUsernames[0]} and ${typingUsernames[1]} are typing`;
            } else if (typingUsernames.length === 3) {
              return `${typingUsernames[0]}, ${typingUsernames[1]}, and ${typingUsernames[2]} are typing`;
            } else {
              return `${typingUsernames[0]}, ${typingUsernames[1]}, and ${typingUsernames.length - 2} others are typing`;
            }
          })();
          
          return (
            <div className="flex items-start gap-3 px-4 py-2 mb-2 animate-fade-in">
              <div className="flex items-center gap-2 bg-neutral-800/80 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg border border-neutral-700/50">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "0ms", animationDuration: "1s" }} />
                  <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "200ms", animationDuration: "1s" }} />
                  <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "400ms", animationDuration: "1s" }} />
                </div>
                <span className="text-sm text-neutral-300 font-medium">
                  {displayText}...
                </span>
              </div>
            </div>
          );
        })()}
        {renderedMessages}
      </div>
      <div className="p-4 bg-neutral-800 flex items-center space-x-2 border-t border-black">
        <AttachmentMenu
          onSendImage={sendImage}
          onSendWaypoint={sendWaypoint}
          onSendDocument={sendDocument}
        />
        <EmojiStickerMenu
          onEmojiSelect={handleEmojiSelect}
          onStickerSelect={sendSticker}
        />
        <Input
          ref={inputRef}
          variant="neutral"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            handleTyping()
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
          placeholder="Escribe un mensaje..."
          className="flex-1"
        />
        <Button type="submit" onClick={sendMessage} className="bg-primary-400 hover:bg-primary-500 text-black">
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

