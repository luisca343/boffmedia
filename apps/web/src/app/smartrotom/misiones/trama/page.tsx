"use client"

import { useBoard } from "../_hooks/useBoard"
import { EmptyBoard, Label } from "../_components/ui"
import { BoardError, BoardLoading } from "../_components/BoardStatus"
import { ThreadWall } from "../_components/ThreadWall"

export default function LaTramaPage() {
  const { quests, isLoading, error } = useBoard()

  return (
    <div className="flex min-h-full flex-col pt-1.5">
      <div className="mb-[18px] text-center">
        <Label className="text-ms-gold-1">El hilo conductor</Label>
        <h1 className="my-1 font-ms-display text-[38px] text-ms-paper-1 [text-shadow:0_2px_12px_rgba(0,0,0,.6)]">La Trama</h1>
        <div className="text-sm italic text-ms-paper-3">
          Cada encargo atado al siguiente con hilo y chinchetas — sigue el rastro
        </div>
      </div>

      {isLoading ? (
        <BoardLoading>Desenrollando el hilo…</BoardLoading>
      ) : error ? (
        <BoardError message={error} />
      ) : quests.length === 0 ? (
        <EmptyBoard>Nadie ha atado un encargo todavía.</EmptyBoard>
      ) : (
        <ThreadWall />
      )}
    </div>
  )
}
