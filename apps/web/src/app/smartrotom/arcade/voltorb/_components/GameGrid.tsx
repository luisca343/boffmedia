"use client"

import { Fragment } from "react"
import { useTranslations } from "next-intl"
import { Skeleton } from "../../_components/ui"
import type { Cell, RowColInfo } from "../types"
import CellComponent from "./Cell"
import HintCell from "./HintCell"

interface GameGridProps {
  grid: Cell[][]
  rowInfo: RowColInfo[]
  colInfo: RowColInfo[]
  onCellClick: (row: number, col: number) => void
  level: number
  roundScore: number
}

/**
 * The board: the column hints across the top, the row hints down the left, the
 * 5×5 of tiles, and the status strip under it. The trailing column is dead space
 * on purpose — it keeps the board off the panel's right edge on desktop.
 */
function GameGrid({ grid, rowInfo, colInfo, onCellClick, level, roundScore }: GameGridProps) {
  const t = useTranslations("arcade")
  if (grid.length === 0) {
    return <Skeleton className="mx-auto aspect-square w-full max-w-[560px] rounded-2xl" />
  }

  return (
    <div className="mx-auto grid max-w-[560px] grid-cols-[44px_repeat(5,minmax(0,1fr))_0px] gap-1.5 md:grid-cols-[48px_repeat(5,minmax(0,1fr))_64px]">
      <div />
      {colInfo.map((info, i) => (
        <HintCell key={`col-${i}`} info={info} label={t("voltorb.columnLabel", { index: i + 1 })} />
      ))}
      <div />

      {grid.map((row, rowIndex) => (
        <Fragment key={`row-${rowIndex}`}>
          <HintCell info={rowInfo[rowIndex]} label={t("voltorb.rowLabel", { index: rowIndex + 1 })} />
          {row.map((cell, colIndex) => (
            <CellComponent
              key={`${rowIndex}-${colIndex}`}
              cell={cell}
              rowIndex={rowIndex}
              colIndex={colIndex}
              onClick={() => onCellClick(rowIndex, colIndex)}
            />
          ))}
          <div />
        </Fragment>
      ))}

      <div />
      <div className="col-span-5 mt-1.5 flex items-center justify-between gap-2 rounded-lg border border-ar-cyan/25 bg-black/40 px-3 py-2">
        <span className="font-ar-display text-[10px] text-ar-cyan">{t("voltorb.levelLabel", { level })}</span>
        <span className="hidden font-ar-mono text-[11px] uppercase text-ar-ink-dim md:inline">
          {t("voltorb.flipHint")}
        </span>
        <span className="ar-glow-amber font-ar-display text-[12px] tabular-nums text-ar-amber">
          ×{roundScore}
        </span>
      </div>
      <div />
    </div>
  )
}

export default GameGrid
