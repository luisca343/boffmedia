import { ExternalLink } from "lucide-react"
import Link from "next/link"
import type { Message as MessageType, VideoMessageData } from "../_types/Chat"

interface VideoMessageProps {
  videoData: VideoMessageData
  sender: "user" | "other"
  timestamp: string
  isSender: boolean
  img: boolean
  message: MessageType
  isFirstInSequence: boolean
  isLastInSequence: boolean
}

export function VideoMessage({
  videoData,
  sender,
  timestamp,
  isSender,
  img,
  message,
  isFirstInSequence,
  isLastInSequence,
}: VideoMessageProps) {
  const videoId = videoData.videoId
  const videoUrl = videoData.url
  const title = videoData.title || "YouTube Video"

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
        className={`relative flex flex-col mb-0.5 min-w-16 max-w-2xl mx-8 ${
          isLastInSequence ? "mb-1" : ""
        } ${isFirstInSequence ? "mt-1" : ""}`}
      >
        {sender !== "user" && img && isLastInSequence && (
          <img
            src={`https://mc-heads.net/avatar/${message.uuid}`}
            alt={`profile picture for ${message.uuid}`}
            className="w-10 h-10 rounded-full absolute -left-6 -bottom-4"
          />
        )}
        {isFirstInSequence && (
          <span className={`text-xs ${sender === "user" ? "text-surface-400 self-end" : "text-surface-500"} mb-1`}>
            {timestamp}
          </span>
        )}
        <div
          className={`overflow-hidden border-2 border-neutral-900 bg-neutral-800 ${getBubbleShape()}`}
        >
          {/* Video Player */}
          <div className="aspect-video w-full max-w-2xl bg-black">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full aspect-video"
            />
          </div>

          {/* Action Bar */}
          <div className="px-3 py-2 border-t border-black/10 bg-neutral-850 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-300 truncate">{title}</p>
            </div>
            <Link
              href={`/smartrotom/mewtube/video/${videoId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-400 hover:bg-primary-500 text-black rounded transition-colors whitespace-nowrap"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Watch in MewTube
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
