"use client"

import { useBoard } from "../_hooks/useBoard"
import { EmptyBoard, Label } from "../_components/ui"
import { BoardError, BoardLoading } from "../_components/BoardStatus"
import { KingdomMap } from "../_components/KingdomMap"

export default function MapaDelReinoPage() {
  const { quests, regions, isLoading, error } = useBoard()

  return (
    <div className="flex min-h-full flex-col pt-1.5">
      <div className="mb-[18px] text-center">
        <Label className="text-ms-gold-1">Atlas</Label>
        <h1 className="my-1 font-ms-display text-[38px] text-ms-paper-1 [text-shadow:0_2px_12px_rgba(0,0,0,.6)]">
          Mapa del Reino
        </h1>
        <div className="text-sm italic text-ms-paper-3">
          Trazado por cartógrafos de Pueblo Paleta — clava un alfiler para ver sus misiones
        </div>
      </div>

      {isLoading ? (
        <BoardLoading>Desenrollando el mapa del reino…</BoardLoading>
      ) : error ? (
        <BoardError message={error} />
      ) : quests.length === 0 || regions.length === 0 ? (
        <EmptyBoard>Nadie ha trazado encargos todavía. El reino aguarda su primera misión.</EmptyBoard>
      ) : (
        <KingdomMap />
      )}
    </div>
  )
}
