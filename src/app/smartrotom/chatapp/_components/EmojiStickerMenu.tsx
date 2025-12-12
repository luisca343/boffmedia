"use client"

import { useState } from "react"
import { Smile, Sticker as StickerIcon, X } from "lucide-react"
import { Button } from "@/components/ui/primitives/button"
import { ScrollArea } from "@/components/ui/primitives/scroll-area"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"

interface EmojiStickerMenuProps {
  onEmojiSelect: (emoji: string) => void
  onStickerSelect: (stickerPath: string) => void
}

export function EmojiStickerMenu({ onEmojiSelect, onStickerSelect }: EmojiStickerMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"emoji" | "sticker">("emoji")

  // Sticker packs
  const stickerPacks = [
    {
      name: "Pokemon",
      stickers: [
        "/smartrotom/img/apps/chatapp/stickers/pikachu_caterpie_patpat.webp",
        "/smartrotom/img/apps/chatapp/stickers/pikachu_chill.webp",
        "/smartrotom/img/apps/chatapp/stickers/psyduck_confused.webp",
        "/smartrotom/img/apps/chatapp/stickers/psyduck_strong.webp",
        "/smartrotom/img/apps/chatapp/stickers/quagsire_stare.webp",
        "/smartrotom/img/apps/chatapp/stickers/slowbro_sweat.webp",
        "/smartrotom/img/apps/chatapp/stickers/squirtle_cry.webp",
        "/smartrotom/img/apps/chatapp/stickers/squirtle_glasses.webp",
        "/smartrotom/img/apps/chatapp/stickers/togepi_eepy.webp",
        "/smartrotom/img/apps/chatapp/stickers/togepi_evil.webp",
        "/smartrotom/img/apps/chatapp/stickers/torchic_run.webp",
        "/smartrotom/img/apps/chatapp/stickers/wooper_choose.webp",
        "/smartrotom/img/apps/chatapp/stickers/wurmple_no.webp",
        "/smartrotom/img/apps/chatapp/stickers/wurmple_puke.webp",
        "/smartrotom/img/apps/chatapp/stickers/jigglypuff_angry.webp",
        "/smartrotom/img/apps/chatapp/stickers/ditto_tired.webp",
        "/smartrotom/img/apps/chatapp/stickers/eevee_wave.webp",
      ]
    }
  ]

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="text-neutral-400 hover:text-neutral-50"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Smile className="h-5 w-5" />}
        </Button>

        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 bg-neutral-800 rounded-2xl shadow-2xl border border-neutral-700 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Tabs */}
            <div className="flex border-b border-neutral-700 bg-neutral-800/95 backdrop-blur-sm">
              <button
                onClick={() => setActiveTab("emoji")}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === "emoji"
                    ? "text-primary-400 border-b-2 border-primary-400"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Smile className="h-4 w-4" />
                Emojis
              </button>
              <button
                onClick={() => setActiveTab("sticker")}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === "sticker"
                    ? "text-primary-400 border-b-2 border-primary-400"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <StickerIcon className="h-4 w-4" />
                Stickers
              </button>
            </div>

            {/* Content */}
            <div>
              {activeTab === "emoji" ? (
                <Picker
                  data={data}
                  onEmojiSelect={(emoji: any) => {
                    onEmojiSelect(emoji.native)
                    setIsOpen(false)
                  }}
                  theme="dark"
                  previewPosition="none"
                  skinTonePosition="search"
                  locale="es"
                  perLine={8}
                />
              ) : (
                <div className="w-[350px] h-[400px]">
                  <ScrollArea className="h-full p-4">
                    <div className="grid grid-cols-4 gap-3">
                    {stickerPacks[0].stickers.map((sticker, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          onStickerSelect(sticker)
                          setIsOpen(false)
                        }}
                        className="aspect-square rounded-xl hover:bg-neutral-700 transition-colors p-2 group"
                      >
                        <img
                          src={sticker}
                          alt={`Sticker ${index + 1}`}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                          onError={(e) => {
                            // Hide broken images
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      </button>
                    ))}
                  </div>
                  {stickerPacks[0].stickers.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                      <StickerIcon className="h-12 w-12 mb-2" />
                      <p className="text-sm">No hay stickers disponibles</p>
                    </div>
                  )}
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
