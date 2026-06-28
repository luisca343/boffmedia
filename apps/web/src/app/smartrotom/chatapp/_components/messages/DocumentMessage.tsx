"use client"

import { FileText, ExternalLink } from "lucide-react"
import Link from "next/link"
import type { Message as MessageType, DocumentMessageData } from "../../_types/Chat"

interface DocumentMessageProps {
  documentData: DocumentMessageData
  sender: "user" | "other"
  timestamp: string
  isSender: boolean
  img: boolean
  message: MessageType
  isFirstInSequence: boolean
  isLastInSequence: boolean
}

export function DocumentMessage({
  documentData,
  sender,
  timestamp,
  isSender,
  img,
  message,
  isFirstInSequence,
  isLastInSequence,
}: DocumentMessageProps) {
  const title = documentData.title
  const preview = documentData.content

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
        className={`relative flex flex-col mb-0.5 min-w-16 max-w-lg mx-8 ${
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
          <span className={`text-xs ${sender === "user" ? "text-ink-muted self-end" : "text-ink-muted"} mb-1`}>
            {timestamp}
          </span>
        )}
        <div
          className={`overflow-hidden border-2 border-neutral-900 bg-neutral-800 ${getBubbleShape()}`}
        >
          {/* Document Preview */}
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-hover/20 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary-hover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-neutral-100 mb-1 truncate">{title}</h3>
                {preview && (
                  <p className="text-sm text-neutral-400 line-clamp-3 break-words">
                    {preview.replace(/<[^>]*>/g, '')}...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="px-3 py-2 border-t border-black/10 bg-neutral-850 flex items-center justify-between gap-2">
            <div className="text-xs text-neutral-400">
              Documento compartido
            </div>
            <Link
              href={`/smartrotom/notas?doc=${documentData.documentId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-hover hover:bg-primary text-black rounded transition-colors whitespace-nowrap"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir documento
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
