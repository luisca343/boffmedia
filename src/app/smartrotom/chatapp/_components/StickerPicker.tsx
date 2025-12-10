"use client"

import { useState } from "react"
import { Button } from "@/components/ui/primitives/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/primitives/popover"
import { ScrollArea } from "@/components/ui/primitives/scroll-area"
import { Sticker } from "lucide-react"

interface StickerPickerProps {
  onStickerSelect: (stickerPath: string) => void
}

const stickers = [
  { name: "Ditto Tired", path: "/smartrotom/img/apps/chatapp/stickers/ditto_tired.webp" },
  { name: "Eevee Wave", path: "/smartrotom/img/apps/chatapp/stickers/eevee_wave.webp" },
  { name: "Jigglypuff Angry", path: "/smartrotom/img/apps/chatapp/stickers/jigglypuff_angry.webp" },
  { name: "Pikachu Caterpie Pat", path: "/smartrotom/img/apps/chatapp/stickers/pikachu_caterpie_patpat.webp" },
  { name: "Pikachu Chill", path: "/smartrotom/img/apps/chatapp/stickers/pikachu_chill.webp" },
  { name: "Psyduck Confused", path: "/smartrotom/img/apps/chatapp/stickers/psyduck_confused.webp" },
  { name: "Psyduck Strong", path: "/smartrotom/img/apps/chatapp/stickers/psyduck_strong.webp" },
  { name: "Quagsire Stare", path: "/smartrotom/img/apps/chatapp/stickers/quagsire_stare.webp" },
  { name: "Slowbro Sweat", path: "/smartrotom/img/apps/chatapp/stickers/slowbro_sweat.webp" },
  { name: "Squirtle Cry", path: "/smartrotom/img/apps/chatapp/stickers/squirtle_cry.webp" },
  { name: "Squirtle Glasses", path: "/smartrotom/img/apps/chatapp/stickers/squirtle_glasses.webp" },
  { name: "Togepi Eepy", path: "/smartrotom/img/apps/chatapp/stickers/togepi_eepy.webp" },
  { name: "Togepi Evil", path: "/smartrotom/img/apps/chatapp/stickers/togepi_evil.webp" },
  { name: "Torchic Run", path: "/smartrotom/img/apps/chatapp/stickers/torchic_run.webp" },
  { name: "Wooper Choose", path: "/smartrotom/img/apps/chatapp/stickers/wooper_choose.webp" },
  { name: "Wurmple No", path: "/smartrotom/img/apps/chatapp/stickers/wurmple_no.webp" },
  { name: "Wurmple Puke", path: "/smartrotom/img/apps/chatapp/stickers/wurmple_puke.webp" },
]

export function StickerPicker({ onStickerSelect }: StickerPickerProps) {
  const [open, setOpen] = useState(false)

  const handleStickerClick = (stickerPath: string) => {
    onStickerSelect(stickerPath)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-neutral-400 hover:text-neutral-50"
        >
          <Sticker className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[360px] p-0 bg-neutral-900 border-neutral-800" 
        align="end"
        side="top"
      >
        <ScrollArea className="h-96 p-3">
          <h3 className="text-sm font-semibold text-neutral-400 mb-3">
            Stickers
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {stickers.map((sticker) => (
              <button
                key={sticker.path}
                onClick={() => handleStickerClick(sticker.path)}
                className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-400 transition-all bg-neutral-800 p-2"
                title={sticker.name}
              >
                <img
                  src={sticker.path}
                  alt={sticker.name}
                  className="w-full h-full object-contain"
                />
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
