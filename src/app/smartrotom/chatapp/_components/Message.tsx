import { getSmartRotomUser, strToTime } from "@/lib/utils"
import type { Message as MessageType, ImageMessageData } from "../_types/Chat"
import { MapPin, Users, ChevronDown } from "lucide-react"
import { useState } from "react"

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
  const caption = imageData.meta.caption

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
            <MetaDropdown meta={meta} />
          )}
        </div>
      </div>
    </div>
  )
}

function MetaDropdown({ meta }: { meta: ImageMessageData['meta'] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="px-3 py-2 border-t border-black/10 text-xs bg-transparent">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between gap-2 text-neutral-600 px-2 py-1 hover:bg-black/5 rounded"
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="font-medium">Detalles</span>
        </div>
        <div className="text-neutral-500 truncate max-w-[160px]">{meta?.id}</div>
        <ChevronDown className={`h-4 w-4 transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-2 space-y-2 text-neutral-700">
          {meta?.timestamp && (
            <div className="text-neutral-500 text-[11px]">{new Date(meta.timestamp).toLocaleString()}</div>
          )}

          {meta?.location && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-neutral-600" />
              <div className="leading-tight text-neutral-700">
                <div>
                  <span className="font-medium">Jugador:</span>{" "}
                  X: {meta.location.playerPosition.x.toFixed(1)}, Y: {meta.location.playerPosition.y.toFixed(1)}, Z: {meta.location.playerPosition.z.toFixed(1)}
                </div>
                <div className="text-neutral-600 text-[12px]">
                  <span className="font-medium">Mirando a:</span>{" "}
                  X: {meta.location.lookingAt.x.toFixed(1)}, Y: {meta.location.lookingAt.y.toFixed(1)}, Z: {meta.location.lookingAt.z.toFixed(1)}
                  {meta.location.lookingAt.block ? <span>{" — "}{meta.location.lookingAt.block}</span> : null}
                </div>
              </div>
            </div>
          )}

          {meta?.entities && meta.entities.length > 0 && (
            <div>
              <div className="text-neutral-600 font-medium text-[12px] mb-1">Entidades ({meta.entities.length})</div>
              <ul className="space-y-1">
                {meta.entities.map((e, i) => (
                  <li key={i} className="flex items-center justify-between text-neutral-700">
                    <div className="truncate">
                      <div className="font-medium">{e.name}</div>
                      <div className="text-neutral-500 text-[12px] truncate">
                        {e.type} • {e.distance}m • {e.coverage}%
                      </div>
                    </div>
                    <div className="ml-3 text-neutral-500 text-[12px]">
                      {`[${e.position.x.toFixed(1)}, ${e.position.y.toFixed(1)}, ${e.position.z.toFixed(1)}]`}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
