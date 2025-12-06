"use client"

import { Message } from "./Message"
import { toast } from "react-toastify"
import type { ChatData, Message as MessageType, ImageMessageData } from "../_types/Chat"
import { Phone, Send, X, Image as ImageIcon } from "lucide-react"
import { Input } from "@/components/ui/primitives/input"
import { ImageGalleryPicker } from "./ImageGalleryPicker"
import type { Screenshot } from "@/stores/cameraGalleryStore"
import { getSmartRotomUser } from "@/lib/utils"
import { Button } from "@/components/ui/primitives/button"
import { useEffect, useRef, useState } from "react"
import { useBoffSession } from "@/services/useBoffSession"
import { ChatAppService } from "@/services/api/smartrotom/chatAppService"
import { CreateMessageDto } from "@/generated/api"
import useSocketStore from "@/stores/useSocketStore"

export function Chat({
  chats,
  activeChat,
  setActiveChat,
}: {
  chats: ChatData[]
  activeChat: number
  setActiveChat: (id: number) => void
}) {
  const [chat, setChat] = useState(chats[0] as ChatData)
  const [message, setMessage] = useState("")
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false)
  const { socket } = useSocketStore()
  const { session } = useBoffSession()

  const messagesStartRef = useRef<HTMLDivElement>(null)

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

  function sendMessage() {
    if (!message.trim()) {
      return
    }

    const newMessage: MessageType = {
      id: Date.now(), // Temporary ID
      content: message,
      createdAt: new Date().toISOString(),
      uuid: getSmartRotomUser(session).uuid,
      chatId: chat.id,
      type: "text",
    }

    setChat((prev) => ({
      ...prev,
      messages: [newMessage, ...prev.messages],
    }))

    ChatAppService
      .createMessage(chat.id, {
        message: message,
        uuid: getSmartRotomUser(session).uuid,
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
    const imageData: any = { caption, screenshot }

    ChatAppService
      .createMessage(chat.id, {
        message: JSON.stringify(imageData),
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
        {chat.messages.map((message, index) => (
          <Message
            key={message.id}
            message={message}
            session={session}
            img={chat.type !== 1}
            prev={index < chat.messages.length - 1 ? chat.messages[index + 1] : null}
            next={index > 0 ? chat.messages[index - 1] : null}
          />
        ))}
      </div>
      <div className="p-4 bg-neutral-800 flex items-center space-x-2 border-t border-black">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setGalleryPickerOpen(true)}
          className="text-neutral-400 hover:text-neutral-50"
        >
          <ImageIcon className="h-5 w-5" />
        </Button>
        <Input
          variant="neutral"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
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
      <ImageGalleryPicker
        open={galleryPickerOpen}
        onOpenChange={setGalleryPickerOpen}
        onSendImage={sendImage}
      />
    </div>
  )
}

