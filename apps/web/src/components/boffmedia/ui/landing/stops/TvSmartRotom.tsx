import * as React from "react"
import { Button } from "@/components/boffmedia/primitives/button"
import { Decode } from "../travesia-fx"
import { TvCP } from "../TvCP"
import { CTA_ROW, PRI_GLOW } from "../landing-shared"
import { TV3_FEATS } from "../landing-data"

export function TvSmartRotom() {
  return (
    <TvCP
      id="tv-cp2"
      n="02"
      side="r"
      kick={<Decode text="Parada 02 · Producto destacado" />}
      title="Smart<em>Rotom</em>"
      lead="Tu smartphone del juego, también en el navegador. Pokédex, mapas, economía y mensajes sincronizados en vivo con tu partida."
    >
      <div className="relative grid justify-items-start gap-[22px] max-[980px]:justify-items-center max-[980px]:text-center">
        <video
          data-tilt-fx
          autoPlay
          muted
          loop
          playsInline
          poster="/img/smartrotom.png"
          aria-label="Demo de SmartRotom"
          className="relative z-[2] aspect-square w-full max-w-[540px] object-cover"
        >
          <source src="/img/rotom_demo3.webm" type="video/webm" />
        </video>
        <div className="relative z-[2] flex flex-wrap gap-x-[18px] gap-y-2.5 max-[980px]:justify-center">
          {TV3_FEATS.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-[9px] font-body text-[13.5px] font-medium leading-[1.3] text-txt max-[980px]:justify-center"
            >
              <i
                className="h-2 w-2 flex-none rotate-45 bg-[rgba(var(--zr),var(--zg),var(--zb),1)] shadow-[0_0_10px_rgba(var(--zr),var(--zg),var(--zb),0.6)] transition-[background] duration-[260ms] ease-linear"
                aria-hidden="true"
              />
              {f}
            </span>
          ))}
        </div>
      </div>
      <div className={CTA_ROW}>
        <Button variant="pri" iconRight="arrow" href="/herramientas" className={PRI_GLOW}>
          Ver SmartRotom
        </Button>
        <Button icon="bell">Avisadme</Button>
      </div>
    </TvCP>
  )
}
