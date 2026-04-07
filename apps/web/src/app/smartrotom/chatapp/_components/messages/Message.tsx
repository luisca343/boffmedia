import { getSmartRotomUser, strToTime } from "@/lib/utils"
import type { Message as MessageType, ImageMessageData, VideoMessageData, DocumentMessageData, WaypointMessageData, CallMessageData } from "../../_types/Chat"
import { SystemMessage } from "./SystemMessage"
import { ImageMessage } from "./ImageMessage"
import { VideoMessage } from "./VideoMessage"
import { DocumentMessage } from "./DocumentMessage"
import { WaypointMessage } from "./WaypointMessage"
import { CallMessage } from "./CallMessage"
import { TextMessage } from "./TextMessage"
import { EmojiMessage } from "./EmojiMessage"
import { StickerMessage } from "./StickerMessage"

export function parseSystemMessage(message: MessageType) {
  return message.content
}

export function parseImageMessage(content: string): ImageMessageData | null {
  try {
    return JSON.parse(content) as ImageMessageData
  } catch {
    return null
  }
}

export function parseVideoMessage(content: string): VideoMessageData | null {
  try {
    return JSON.parse(content) as VideoMessageData
  } catch {
    return null
  }
}

export function parseDocumentMessage(content: string): DocumentMessageData | null {
  try {
    return JSON.parse(content) as DocumentMessageData
  } catch {
    return null
  }
}

export function parseWaypointMessage(content: string): WaypointMessageData | null {
  try {
    return JSON.parse(content) as WaypointMessageData
  } catch {
    return null
  }
}

export function parseCallMessage(content: string): CallMessageData | null {
  try {
    // If content is just a number (duration in seconds), parse it
    const duration = parseInt(content, 10)
    if (!isNaN(duration)) {
      return { duration }
    }
    // Otherwise try to parse as JSON
    return JSON.parse(content) as CallMessageData
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

  if (message.type === "call") {
    const callData = parseCallMessage(message.content)
    if (callData) {
      return (
        <CallMessage
          callData={callData}
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

  if(sender === "system") return (
    <SystemMessage content={content} />
  )

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

  if (message.type === "video") {
    const videoData = parseVideoMessage(message.content)
    if (videoData) {
      return (
        <VideoMessage
          videoData={videoData}
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

  if (message.type === "document") {
    const documentData = parseDocumentMessage(message.content)
    if (documentData) {
      return (
        <DocumentMessage
          documentData={documentData}
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

  if (message.type === "waypoint") {
    const waypointData = parseWaypointMessage(message.content)
    if (waypointData) {
      return (
        <WaypointMessage
          waypointData={waypointData}
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

  if (message.type === "emoji") {
    return (
      <EmojiMessage
        message={message}
        content={content}
        sender={sender}
        timestamp={timestamp}
        img={img}
        isFirstInSequence={isFirstInSequence}
        isLastInSequence={isLastInSequence}
      />
    )
  }

  if (message.type === "sticker") {
    return (
      <StickerMessage
        message={message}
        content={content}
        sender={sender}
        timestamp={timestamp}
        img={img}
        isFirstInSequence={isFirstInSequence}
        isLastInSequence={isLastInSequence}
      />
    )
  }

  return (
    <TextMessage
      message={message}
      content={content}
      sender={sender}
      timestamp={timestamp}
      img={img}
      isFirstInSequence={isFirstInSequence}
      isLastInSequence={isLastInSequence}
    />
  )
}