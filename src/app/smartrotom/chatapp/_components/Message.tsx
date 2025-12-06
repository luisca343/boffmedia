import { getSmartRotomUser, strToTime } from "@/lib/utils"
import type { Message as MessageType, ImageMessageData } from "../_types/Chat"
import { MapPin, Users } from "lucide-react"

export function parseSystemMessage(message: MessageType) {
  if (message.type === "call") return `Llamada de ${message.content} segundos`
  return message.content
}

export function parseImageMessage(content: string): ImageMessageData | null {
  try {
    return JSON.parse(content) as ImageMessageData
  } catch {
    return null
  }
}

export function Message({
  message,
  session,
  img = false,
  prev,
  next,
}: {
  message: MessageType
  session: any
  img?: boolean
  prev: MessageType | null
  next: MessageType | null
}) {
  const isSender = message.uuid === getSmartRotomUser(session).uuid
  const sender = message.uuid === "system" ? "system" : isSender ? "user" : "other"
  const content = message.uuid === "system" ? parseSystemMessage(message) : message.content
  const timestamp = strToTime(message.createdAt)

  const isFirstInSequence = !prev || prev.uuid !== message.uuid
  const isLastInSequence = !next || next.uuid !== message.uuid

  const getBubbleShape = () => {
    if (sender === "system") return "rounded-lg"
    if (isSender) {
      if (isFirstInSequence && isLastInSequence) return "rounded-3xl"
      if (isLastInSequence) return "rounded-b-3xl rounded-tl-3xl rounded-tr-lg"
      if (isFirstInSequence) return "rounded-t-3xl rounded-bl-3xl rounded-br-lg"
      return "rounded-l-3xl rounded-r-lg"
    } else {
      if (isFirstInSequence && isLastInSequence) return "rounded-3xl"
      if (isLastInSequence) return "rounded-b-3xl rounded-tr-3xl rounded-tl-lg"
      if (isFirstInSequence) return "rounded-t-3xl rounded-br-3xl rounded-bl-lg"
      return "rounded-r-3xl rounded-l-lg"
    }
  }

  if(sender === "system") return (
    <SystemMessage content={content} />
  )

  console.log("Rendering message:", message);

  if (message.type === "image") {
    const imageData = parseImageMessage(message.content)
    if (imageData) {
      return (
        <ImageMessage
          imageData={imageData}
          sender={sender}
          timestamp={timestamp}
          isSender={isSender}
          img={img}
          message={message}
          isFirstInSequence={isFirstInSequence}
          isLastInSequence={isLastInSequence}
        />
      )
    }
  }

  return (
    <div className={`flex w-full ${sender === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative flex flex-col mb-0.5 min-w-16  text-lg max-w-3xl mx-2 ${
          isLastInSequence ? "mb-1" : ""
        } ${isFirstInSequence ? "mt-1" : ""}`}
      >
        {sender !== "user" && img && isLastInSequence && (
          <img
            src={`https://crafatar.com/avatars/${message.uuid}`}
            alt={`profile picture for ${message.uuid}`}
            className="w-6 h-6 rounded-full absolute -left-4 -bottom-2"
          />
        )}
        {isFirstInSequence && (
          <span className={`text-xs ${sender === "user" ? "text-surface-400 self-end" : "text-surface-500"} mb-1`}>
            {timestamp}
          </span>
        )}
        <div
          className={`px-4 py-2 ${getBubbleShape()} ${
            sender === "user"
                ? "bg-primary-400 text-neutral-800"
                : "bg-surface-300 text-neutral-800"
          }`}
        >
          <span className="break-words">{content}</span>
        </div>
      </div>
    </div>
  )
}

export function SystemMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-center text-sm text-surface-500">
      <span className="px-2 my-1 bg-surface-200 rounded-lg">{content}</span>
    </div>
  )
}

interface ImageMessageProps {
  imageData: ImageMessageData
  sender: "user" | "other"
  timestamp: string
  isSender: boolean
  img: boolean
  message: MessageType
  isFirstInSequence: boolean
  isLastInSequence: boolean
}

export function ImageMessage({
  imageData,
  sender,
  timestamp,
  isSender,
  img,
  message,
  isFirstInSequence,
  isLastInSequence,
}: ImageMessageProps) {
  // New DB format: { imageUrl, meta: { id, timestamp, location?, entities? }, caption? }
  const imageUrl = imageData.imageUrl
  const meta = imageData.meta
  const caption = imageData.caption

  const getBubbleShape = () => {
    if (isSender) {
      if (isFirstInSequence && isLastInSequence) return "rounded-3xl"
      if (isLastInSequence) return "rounded-b-3xl rounded-tl-3xl rounded-tr-lg"
      if (isFirstInSequence) return "rounded-t-3xl rounded-bl-3xl rounded-br-lg"
      return "rounded-l-3xl rounded-r-lg"
    } else {
      if (isFirstInSequence && isLastInSequence) return "rounded-3xl"
      if (isLastInSequence) return "rounded-b-3xl rounded-tr-3xl rounded-tl-lg"
      if (isFirstInSequence) return "rounded-t-3xl rounded-br-3xl rounded-bl-lg"
      return "rounded-r-3xl rounded-l-lg"
    }
  }

  return (
    <div className={`flex w-full ${sender === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative flex flex-col mb-0.5 min-w-16 text-lg max-w-3xl mx-2 ${
          isLastInSequence ? "mb-1" : ""
        } ${isFirstInSequence ? "mt-1" : ""}`}
      >
        {sender !== "user" && img && isLastInSequence && (
          <img
            src={`https://crafatar.com/avatars/${message.uuid}`}
            alt={`profile picture for ${message.uuid}`}
            className="w-6 h-6 rounded-full absolute -left-4 -bottom-2"
          />
        )}
        {isFirstInSequence && (
          <span className={`text-xs ${sender === "user" ? "text-surface-400 self-end" : "text-surface-500"} mb-1`}>
            {timestamp}
          </span>
        )}
        <div
          className={`overflow-hidden ${getBubbleShape()} ${
            sender === "user" ? "bg-primary-400" : "bg-surface-300"
          }`}
        >
          <img
            src={imageUrl}
            alt="Screenshot"
            className="w-full max-w-md object-cover"
          />
          {caption && (
            <div className="px-4 py-2">
              <span className="break-words text-neutral-800">{caption}</span>
            </div>
          )}
          {(meta?.location || (meta?.entities && meta.entities.length > 0)) && (
            <div className="px-3 py-2 border-t border-black/10 text-xs space-y-1">
              {meta?.location && (
                <div className="flex items-center gap-1 text-neutral-700">
                  <MapPin className="h-3 w-3" />
                  <span>
                    X: {meta.location.playerPosition.x.toFixed(0)}, Y: {" "}
                    {meta.location.playerPosition.y.toFixed(0)}, Z: {" "}
                    {meta.location.playerPosition.z.toFixed(0)}
                  </span>
                </div>
              )}
              {meta?.entities && meta.entities.length > 0 && (
                <div className="flex items-center gap-1 text-neutral-700">
                  <Users className="h-3 w-3" />
                  <span>{meta.entities.length} entidad{meta.entities.length !== 1 ? "es" : ""}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
