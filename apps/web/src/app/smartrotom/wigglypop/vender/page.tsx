"use client"

import { useState } from "react"
import { SellItem } from "../_components/sell/SellItem"
import { SellMon } from "../_components/sell/SellMon"
import { Seg } from "../_components/ui"

type Kind = "mon" | "item"

/**
 * Vender. A thin orchestrator (§12) over the two listing flows.
 *
 * There is no "Lote" tab. The handoff drew one, and the backend supports bundles —
 * but a bundle composer that lets you stake several Pokémon at once is a much bigger
 * commitment surface than a single sale, and it is not worth shipping half of it.
 * Registered in `docs/smartrotom/deferred/`.
 */
export default function SellPage() {
  const [kind, setKind] = useState<Kind>("mon")

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex flex-none flex-wrap items-center gap-4 border-b border-wp-line/24 px-[30px] py-[18px]">
        <div>
          <h1 className="font-wp-display text-[21px] font-semibold text-wp-fg">Vender</h1>
          <p className="mt-0.5 font-wp text-[12.5px] font-semibold text-wp-fg-subtle">
            {kind === "mon"
              ? "Publica un Pokémon desde tu PC, con verificación de propiedad"
              : "Publica objetos del catálogo Rotom"}
          </p>
        </div>
        <Seg
          options={[
            { key: "mon", label: "Pokémon", icon: "grid" },
            { key: "item", label: "Objeto", icon: "package" },
          ]}
          value={kind}
          onChange={(k) => setKind(k as Kind)}
        />
      </div>

      <div className="wp-scroll min-h-0 flex-1 overflow-y-auto px-[30px] py-6">
        {kind === "mon" ? <SellMon /> : <SellItem />}
      </div>
    </div>
  )
}
