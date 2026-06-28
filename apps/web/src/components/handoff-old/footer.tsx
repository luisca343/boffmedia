"use client"

import * as React from "react"
import { Icon } from "../primitives/icon"
import { BoffButton as Button } from "../primitives/button"
import { IconButton } from "./icon-button"

const FOOTER_COLS = [
  { title: "Plataforma", links: [["Juegos", "/herramientas"], ["Eventos", "/eventos"], ["Herramientas", "/herramientas"], ["Comunidad", "/comunidad"], ["Clasificación", "/eventos"]] },
  { title: "Recursos", links: [["Blog", "#"], ["Componentes", "/componentes"], ["Servidores", "#"], ["Estado", "#"], ["API", "#"]] },
  { title: "Compañía", links: [["Sobre nosotros", "#"], ["Contacto", "#"], ["Prensa", "#"], ["Discord", "#"]] },
]

interface FooterProps {
  go: (path: string) => void
}

export function Footer({ go }: FooterProps) {
  const year = new Date().getFullYear()
  const handle = (href: string) => (e: React.MouseEvent) => {
    if (href && href.startsWith("/")) { e.preventDefault(); go(href) }
  }

  return (
    <footer className="border-t border-edge bg-layer-1 mt-auto">
      <div className="grid grid-cols-[1.1fr_2fr] gap-14 py-16 px-8 max-[920px]:grid-cols-1 max-[920px]:gap-10">
        <div className="flex flex-col gap-[1.1rem] max-w-[30ch]">
          <a href="#" onClick={(e) => { e.preventDefault(); go("/") }} className="inline-flex items-center gap-[0.6rem]">
            <img src="/assets/boff-logo.webp" alt="" width={34} height={34} className="rounded-[6px]" />
            <span className="relative font-display font-extrabold text-[1.3rem] tracking-[0.01em] text-[var(--orange-500)] pr-[2.6rem]">
              BoffMedia
              <span className="absolute -top-[0.4rem] right-0 font-mono text-[0.5rem] font-bold tracking-[0.1em] px-[0.3rem] py-[0.12rem] text-[var(--on-secondary)] bg-secondary-hover rounded-[3px]">BETA</span>
            </span>
          </a>
          <p className="text-[length:var(--t-sm)] leading-[1.65] text-ink-muted m-0">
            La plataforma para la comunidad de gaming, herramientas competitivas y eventos. Hecho por jugadores, para jugadores.
          </p>
          <div className="flex gap-[0.6rem]">
            <IconButton icon="discord" label="Discord" bordered href="#" />
            <IconButton icon="globe" label="Web" bordered href="#" />
            <IconButton icon="message" label="Foro" bordered href="#" />
            <IconButton icon="star" label="Reseñas" bordered href="#" />
          </div>
        </div>

        <div className="grid grid-cols-[repeat(3,1fr)_1.4fr] gap-8 max-[920px]:grid-cols-2 max-[560px]:grid-cols-1">
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <h4 className="font-mono text-[length:var(--t-xs)] font-bold uppercase tracking-[var(--label-spacing,0.1em)] text-ink m-0 mb-[1.1rem]">{col.title}</h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-[0.7rem]">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href.startsWith("/") ? `#${href}` : href}
                      onClick={handle(href)}
                      className="text-[length:var(--t-sm)] text-ink-muted transition-colors duration-[var(--dur)] hover:text-[var(--orange-500)]"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="font-mono text-[length:var(--t-xs)] font-bold uppercase tracking-[var(--label-spacing,0.1em)] text-ink m-0 mb-[1.1rem]">Newsletter</h4>
            <p className="text-ink-muted text-[length:var(--t-sm)] mt-0 mb-0">Novedades, torneos y lanzamientos.</p>
            <form className="flex gap-[0.5rem] mt-[0.9rem]" onSubmit={(e) => e.preventDefault()}>
              <input
                className="flex-1 h-[46px] px-4 rounded-[var(--btn-radius,var(--radius-pill,9999px))] text-[length:var(--t-sm)] bg-layer-2 border border-edge-strong text-ink outline-none focus:border-secondary"
                type="email"
                placeholder="tu@correo.com"
                aria-label="Correo"
              />
              <Button variant="primary" iconRight="arrow" aria-label="Suscribirse" />
            </form>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 py-[1.4rem] px-8 border-t border-edge text-[length:var(--t-sm)] max-[560px]:flex-col max-[560px]:items-start">
        <span className="text-ink-dim">© {year} BoffMedia. Todos los derechos reservados.</span>
        <div className="flex gap-6">
          {["Privacidad", "Términos", "Cookies"].map((label) => (
            <a
              key={label}
              href="#"
              onClick={(e) => { e.preventDefault(); go("/privacidad") }}
              className="text-ink-muted transition-colors duration-[var(--dur)] hover:text-[var(--orange-500)]"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
