"use client"

import * as React from "react"
import { Icon } from "../../primitives/icon"
import { BoffButton as Button } from "../../primitives/button"
import { BoffSkeleton as Skeleton } from "../../primitives/skeleton"

function SkelCard() {
  return (
    <div className="border border-edge rounded-[var(--radius-lg)] bg-layer-2 p-4 flex flex-col gap-3">
      <Skeleton w="100%" h={84} radius="var(--radius)" />
      <div className="flex items-center gap-[0.7rem]">
        <Skeleton h={34} circle />
        <div className="flex-1 flex flex-col gap-[6px]">
          <Skeleton w="80%" h={11} />
          <Skeleton w="50%" h={9} />
        </div>
      </div>
      <Skeleton w="100%" h={9} />
      <Skeleton w="65%" h={9} />
    </div>
  )
}

export function SystemStatesDemoSkeleton() {
  const [loading, setLoading] = React.useState(true)

  return (
    <div className="border border-solid border-edge rounded-[var(--radius-lg)] bg-[var(--card-bg)] p-[clamp(1.4rem,3vw,2.2rem)] mt-[1.2rem]">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-[1.3rem]">
        <span className="font-display text-[length:var(--t-lg)] font-bold">Rejilla de herramientas · carga</span>
        <Button variant="ghost" size="sm" icon={loading ? "play" : "refresh"} onClick={() => setLoading((v) => !v)}>
          {loading ? "Mostrar cargado" : "Mostrar esqueleto"}
        </Button>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkelCard key={i} />)
          : Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-edge rounded-[var(--radius-lg)] bg-[var(--card-bg)] p-4 flex flex-col gap-3">
                <div className="h-[84px] rounded-[var(--radius)] bg-secondary-soft grid place-items-center text-secondary-hover">
                  <Icon name={["sword", "calc", "tree", "cards"][i]} size={26} />
                </div>
                <div className="flex items-center gap-[0.7rem]">
                  <span className="w-[34px] h-[34px] rounded-full bg-layer-3 grid place-items-center shrink-0">
                    <Icon name="gamepad" size={16} />
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-[length:var(--t-sm)]">{["Battlesim", "Calc VGC", "Árbol MH", "Wonder Mail"][i]}</div>
                    <div className="text-ink-dim text-[length:var(--t-xs)]">Herramienta</div>
                  </div>
                </div>
                <p className="text-ink-muted text-[length:var(--t-xs)] m-0">Lista para usar — datos cargados.</p>
              </div>
            ))}
      </div>
    </div>
  )
}
