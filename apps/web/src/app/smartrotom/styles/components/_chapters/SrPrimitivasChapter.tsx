"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { SmartRotomBadge, SmartRotomButton, SmartRotomPanel } from "@/components/smartrotom/ui"
import { Loading, LoadingScreen } from "@/components/smartrotom/Loading"
import { HEAD4, MONO_LABEL, Sample, Section } from "../showcase-shared"

function GearGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m10 10 2.1 2.1m0-14.2-2.1 2.1m-10 10-2.1 2.1" />
    </svg>
  )
}

export function SrPrimitivasChapter() {
  return (
    <>
      <Section
        id="sr-botones"
        kicker="Primitivas"
        title="Botones"
        lead={
          <>
            <code>SmartRotomButton</code> — corte diagonal, borde de 2px y display recto en mayúsculas. Cinco
            variantes y cuatro tamaños; el tamaño también ajusta el corte (<code>[--cut:7px]</code> en{" "}
            <code>sm</code>, 11px en <code>lg</code>).
          </>
        }
      >
        <Sample
          title="Variantes"
          code='variant="default | neutral | noShadow | ghost | danger"'
          note={
            <>
              <code>default</code> es el CTA relleno de acento; <code>neutral</code> el contorno secundario;{" "}
              <code>noShadow</code> un relleno suave sin borde para acciones en línea; <code>ghost</code> solo
              texto; <code>danger</code> el contorno rojo que se rellena al pasar el cursor.
            </>
          }
        >
          <SmartRotomButton>Guardar</SmartRotomButton>
          <SmartRotomButton variant="neutral">Cancelar</SmartRotomButton>
          <SmartRotomButton variant="noShadow">Duplicar</SmartRotomButton>
          <SmartRotomButton variant="ghost">Descartar</SmartRotomButton>
          <SmartRotomButton variant="danger">Eliminar</SmartRotomButton>
        </Sample>

        <Sample title="Tamaños" code='size="sm | default | lg | icon"'>
          <SmartRotomButton size="sm">Pequeño</SmartRotomButton>
          <SmartRotomButton>Normal</SmartRotomButton>
          <SmartRotomButton size="lg">Grande</SmartRotomButton>
          <SmartRotomButton size="icon" aria-label="Ajustes">
            <GearGlyph />
          </SmartRotomButton>
          <SmartRotomButton variant="neutral" size="icon" aria-label="Ajustes">
            <GearGlyph />
          </SmartRotomButton>
        </Sample>

        <Sample
          title="Estados"
          code="disabled · asChild"
          note={
            <>
              Con <code>asChild</code> el botón cede su etiqueta al hijo (un <code>Link</code>, por ejemplo) y
              conserva el estilo. Deshabilitado: opacidad 45 % y sin eventos.
            </>
          }
        >
          <SmartRotomButton disabled>Deshabilitado</SmartRotomButton>
          <SmartRotomButton variant="neutral" disabled>
            Deshabilitado
          </SmartRotomButton>
          <SmartRotomButton asChild>
            <a href="#sr-botones">Enlace con estilo de botón</a>
          </SmartRotomButton>
        </Sample>
      </Section>

      <Section
        id="sr-badges"
        kicker="Primitivas"
        title="Badges"
        lead={
          <>
            <code>SmartRotomBadge</code> — la etiqueta de 11px con corte de 5px. Tres variantes; la tercera,{" "}
            <code>button</code>, es la única interactiva (cursor y relleno de acento al pasar el cursor).
          </>
        }
      >
        <Sample title="Variantes" code='variant="default | neutral | button"'>
          <SmartRotomBadge>Nuevo</SmartRotomBadge>
          <SmartRotomBadge variant="neutral">Borrador</SmartRotomBadge>
          <SmartRotomBadge variant="button">Filtrar</SmartRotomBadge>
        </Sample>

        <Sample
          title="En contexto"
          code="con contadores"
          note={
            <>
              El badge es un <code>div</code>, no un <code>button</code>: si <code>variant=&quot;button&quot;</code>{" "}
              necesita ser pulsable de verdad, envuélvelo o pásale un <code>onClick</code> con su rol.
            </>
          }
        >
          <span className="flex items-center gap-2">
            <span className={cn(HEAD4, "text-[14px] text-sr-txt")}>Notificaciones</span>
            <SmartRotomBadge>12</SmartRotomBadge>
          </span>
          <span className="flex items-center gap-2">
            <span className={cn(HEAD4, "text-[14px] text-sr-txt")}>Servidor</span>
            <SmartRotomBadge variant="neutral">Wingull</SmartRotomBadge>
          </span>
        </Sample>
      </Section>

      <Section
        id="sr-paneles"
        kicker="Primitivas"
        title="Paneles"
        lead={
          <>
            <code>SmartRotomPanel</code> — la superficie del chrome. Cabecera opcional (<code>title</code> +{" "}
            <code>aside</code>) y esquina cortada (<code>cut-corner</code>) salvo que pidas <code>flat</code>.
            El relleno del cuerpo se sobrescribe con <code>bodyClassName</code>.
          </>
        }
      >
        <Sample title="Con cabecera" code="title · aside" grid>
          <SmartRotomPanel title="Ajustes" aside={<SmartRotomBadge variant="neutral">v3</SmartRotomBadge>}>
            <p className="font-body text-[14px] leading-[1.6] text-sr-txt-muted">
              La esquina superior derecha va cortada a 16px (<code className="font-mono text-[12px] text-sr-accent">--cut-lg</code>).
            </p>
          </SmartRotomPanel>
          <SmartRotomPanel
            title="Con acción"
            aside={
              <SmartRotomButton size="sm" variant="ghost">
                Editar
              </SmartRotomButton>
            }
          >
            <p className="font-body text-[14px] leading-[1.6] text-sr-txt-muted">
              <code className="font-mono text-[12px] text-sr-accent">aside</code> se alinea a la derecha de la
              cabecera: badges, botones pequeños o un contador.
            </p>
          </SmartRotomPanel>
        </Sample>

        <Sample
          title="Sin cabecera y plano"
          code="flat · bodyClassName"
          grid
          note={
            <>
              <code>flat</code> quita el corte de esquina — úsalo cuando el panel se apila con otros o vive dentro
              de una rejilla donde el corte rompería la alineación.
            </>
          }
        >
          <SmartRotomPanel>
            <span className={MONO_LABEL}>Sin título</span>
            <p className="mt-2 font-body text-[14px] leading-[1.6] text-sr-txt-muted">
              Sin <code className="font-mono text-[12px] text-sr-accent">title</code> no se renderiza la cabecera.
            </p>
          </SmartRotomPanel>
          <SmartRotomPanel flat title="Plano" bodyClassName="p-0">
            <div className="grid">
              {["Perfil", "Tema", "Sonido"].map((row) => (
                <span
                  key={row}
                  className="border-x-0 border-t-0 border-b border-solid border-sr-line py-[11px] px-4 font-mono text-[12px] uppercase tracking-[0.1em] text-sr-txt-muted last:border-b-0"
                >
                  {row}
                </span>
              ))}
            </div>
          </SmartRotomPanel>
        </Sample>
      </Section>

      <Section
        id="sr-carga"
        kicker="Primitivas"
        title="Carga"
        lead={
          <>
            Un único spinner: un anillo de 2px con el borde superior transparente girando. <code>Loading</code>{" "}
            acepta <code>width</code>, <code>height</code> y un <code>colorClass</code> (una clase de{" "}
            <em>borde</em> completa, nunca construida al vuelo) — por defecto{" "}
            <code>border-sr-accent</code>.
          </>
        }
      >
        <Sample
          title="Spinner"
          code="<Loading width height colorClass>"
          note={
            <>
              <code>colorClass</code> reemplaza el color del anillo entero, así que pásale siempre una clase{" "}
              <code>border-*</code> literal: <code>border-sr-ok</code>, <code>border-sr-bad</code>…
            </>
          }
        >
          {[
            ["24px", 24, "border-sr-accent"],
            ["40px", 40, "border-sr-accent"],
            ["40px · ok", 40, "border-sr-ok"],
            ["40px · bad", 40, "border-sr-bad"],
            ["64px", 64, "border-sr-txt-dim"],
          ].map(([label, size, tone]) => (
            <div key={label as string} className="grid justify-items-center gap-2">
              <Loading width={size as number} height={size as number} colorClass={tone as string} />
              <code className="font-mono text-[10px] leading-none text-sr-txt-dim">{label as string}</code>
            </div>
          ))}
        </Sample>

        <Sample
          title="Pantalla de carga"
          code="<LoadingScreen>"
          padded={false}
          note={
            <>
              <code>LoadingScreen</code> ocupa el 100 % de su contenedor y pinta el fondo{" "}
              <code>bg-sr-bg</code>: móntalo dentro de la caja que está esperando, no en la página entera.
            </>
          }
        >
          <div className="h-[220px] w-full border border-solid border-sr-line">
            <LoadingScreen />
          </div>
        </Sample>
      </Section>
    </>
  )
}
