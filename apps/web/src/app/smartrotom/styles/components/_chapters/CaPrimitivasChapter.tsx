"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Sample, Section } from "../showcase-shared"
import {
  Avatar,
  Button,
  Chip,
  CountBadge,
  Dots,
  Field,
  Icon,
  IconButton,
  MiniButton,
  Modal,
  ModalFoot,
  PopItem,
  Popover,
  Presence,
  SearchBox,
  Skeleton,
  Toggle,
  type PresenceStatus,
} from "../../../chatapp/_components/ui"

const HEAD = "069a79f4-44e9-4726-a5be-fca90e38aaf5"
const mcHead = (uuid: string) => `https://mc-heads.net/avatar/${uuid}`

// Every primitive resolves `--ca-*` from its `.ca-app` root, so the same tree mounted
// under two roots is the cheapest possible proof that the system really themes.
function ThemePair({ children, stack }: { children: React.ReactNode; stack?: boolean }) {
  return (
    // `stack` drops to one column per theme. The Modal panel is a fixed `w-[28.75rem]`, so
    // in a side-by-side half-column it overflows the stage and gets clipped — anything
    // wider than ~440px has to stack.
    <div className={cn("grid w-full grid-cols-1", !stack && "lg:grid-cols-2")}>
      {(["light", "dark"] as const).map((t) => (
        <div key={t} className="ca-app bg-ca-panel p-[1.375rem] font-ca text-ca-50 antialiased" data-theme={t}>
          <div className="mb-4 font-ca-mono text-[0.625rem] uppercase tracking-[0.16em] text-ca-400">
            {t === "light" ? "Claro" : "Oscuro"}
          </div>
          <div className="flex flex-wrap items-center gap-4">{children}</div>
        </div>
      ))}
    </div>
  )
}

const PRESENCES: readonly (readonly [PresenceStatus, string])[] = [
  ["online", "En línea"],
  ["ingame", "Jugando"],
  ["offline", "Desconectado"],
] as const

export function CaPrimitivasChapter() {
  const [q, setQ] = React.useState("")
  const [notif, setNotif] = React.useState(true)
  const [sound, setSound] = React.useState(false)
  const [modal, setModal] = React.useState(true)

  return (
    <>
      <Section
        id="ca-botones"
        kicker="ChatApp"
        title="Botones"
        lead="Cuatro formas para cuatro trabajos: Button para la acción de un diálogo, MiniButton para las acciones de una tarjeta, IconButton para el chrome (cabeceras, redactor) y Chip para filtrar. Todos beben del acento, así que todos se repintan cuando cambia."
      >
        <Sample
          app="ca"
          title="Button"
          code="variant: primary | ghost"
          padded={false}
          note={
            <>
              Píldora de 24&nbsp;px de radio. <code>primary</code> rellena con el acento; <code>ghost</code> es texto en{" "}
              <code>accent-soft</code> con un fondo del 10&nbsp;%. Con <code>href</code> renderiza un{" "}
              <code>next/link</code> en vez de un <code>button</code>.
            </>
          }
        >
          <ThemePair>
            <Button>Crear grupo</Button>
            <Button>
              <Icon name="send" size={16} /> Enviar
            </Button>
            <Button variant="ghost">Cancelar</Button>
            <Button disabled>Sin conexión</Button>
          </ThemePair>
        </Sample>

        <Sample
          app="ca"
          title="MiniButton"
          code="accent · grow"
          padded={false}
          note={
            <>
              Por defecto <code>grow</code> está activo y las acciones se reparten el ancho de la tarjeta (así van en las
              burbujas de ubicación y documento). Aquí se muestran con <code>grow={"{false}"}</code> para verlas a su
              tamaño natural.
            </>
          }
        >
          <ThemePair>
            <MiniButton grow={false}>
              <Icon name="copy" size={14} /> Copiar
            </MiniButton>
            <MiniButton grow={false} accent>
              <Icon name="plus" size={14} /> Añadir waypoint
            </MiniButton>
          </ThemePair>
        </Sample>

        <Sample
          app="ca"
          title="IconButton"
          code="icon · active"
          padded={false}
          note="Redondo, 40×40, sin etiqueta: el title es también su aria-label. En estado activo pasa a un fondo de acento al 14 %."
        >
          <ThemePair>
            <IconButton icon="search" title="Buscar" />
            <IconButton icon="phone" iconSize={18} title="Llamar" />
            <IconButton icon="video" iconSize={20} title="Videollamada" />
            <IconButton icon="paperclip" title="Adjuntar" active />
            <IconButton icon="more" title="Más" />
          </ThemePair>
        </Sample>

        <Sample app="ca" title="Chip" code="active · badge" padded={false}>
          <ThemePair>
            <Chip active>Todos</Chip>
            <Chip>No leídos</Chip>
            <Chip badge={3}>Grupos</Chip>
            <Chip>Favoritos</Chip>
          </ThemePair>
        </Sample>
      </Section>

      <Section
        id="ca-formularios"
        kicker="ChatApp"
        title="Campos y búsqueda"
        lead="Tres entradas y ninguna más: Field para escribir un nombre, SearchBox para filtrar y Toggle para un ajuste. El foco nunca dibuja un anillo del navegador — siempre es el acento."
      >
        <Sample
          app="ca"
          title="Field"
          code="input"
          padded={false}
          note="Entrada rellena con subrayado de acento (Material clásico). Es un input sin estado propio: pásale value/onChange o defaultValue."
        >
          <ThemePair>
            <div className="w-full max-w-[18.75rem]">
              <Field defaultValue="Equipo Wingull" />
            </div>
            <div className="w-full max-w-[18.75rem]">
              <Field placeholder="Nombre del grupo…" />
            </div>
          </ThemePair>
        </Sample>

        <Sample
          app="ca"
          title="SearchBox"
          code="value · onChange · right"
          padded={false}
          note={
            <>
              Controlado. El slot <code>right</code> aloja la pista de teclado o el botón de limpiar. Al enfocar, el
              borde y la sombra pasan al acento.
            </>
          }
        >
          <ThemePair>
            <SearchBox
              value={q}
              onChange={setQ}
              placeholder="Buscar o empezar un chat"
              className="w-full max-w-[20rem]"
              right={
                q ? (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    aria-label="Limpiar"
                    className="grid h-5 w-5 flex-none place-items-center rounded-full text-ca-500 hover:text-ca-100"
                  >
                    <Icon name="x" size={14} />
                  </button>
                ) : (
                  <kbd className="flex-none font-ca-mono text-[0.625rem] text-ca-500">⌘K</kbd>
                )
              }
            />
          </ThemePair>
        </Sample>

        <Sample app="ca" title="Toggle" code="on · onClick" padded={false}>
          <ThemePair>
            <div className="flex w-full max-w-[20rem] flex-col gap-3">
              <label className="flex items-center gap-3 text-[0.90625rem] text-ca-100">
                <Toggle on={notif} onClick={() => setNotif((s) => !s)} />
                Notificaciones
              </label>
              <label className="flex items-center gap-3 text-[0.90625rem] text-ca-100">
                <Toggle on={sound} onClick={() => setSound((s) => !s)} />
                Sonido de mensaje
              </label>
            </div>
          </ThemePair>
        </Sample>
      </Section>

      <Section
        id="ca-avatares"
        kicker="ChatApp"
        title="Avatar y presencia"
        lead="Una única fuente de verdad para las caras: imagen redonda con image-rendering: pixelated (son cabezas de Minecraft, no fotos) y un punto de presencia opcional abajo a la derecha."
      >
        <Sample
          app="ca"
          title="Avatar"
          code="src · size · presence"
          padded={false}
          note={
            <>
              El tamaño es un número, no una clase — el punto de presencia se posiciona contra el contenedor, así que
              escala solo. El anillo del punto usa <code>border-ca-panel</code>: si el avatar va sobre otra superficie,
              corrígelo con <code>presenceClassName</code>.
            </>
          }
        >
          <ThemePair>
            {[32, 40, 49, 56].map((s) => (
              <Avatar key={s} src={mcHead(HEAD)} size={s} alt="" />
            ))}
            <Avatar src={mcHead(HEAD)} size={49} presence="online" alt="" />
          </ThemePair>
        </Sample>

        <Sample
          app="ca"
          title="Presence"
          code="online | ingame | offline"
          padded={false}
          note="«Jugando» reutiliza el acento a propósito: es el estado que el resto de SmartRotom considera «dentro del servidor»."
        >
          <ThemePair>
            {PRESENCES.map(([status, label]) => (
              <div key={status} className="flex flex-col items-center gap-2">
                <Avatar src={mcHead(HEAD)} size={49} presence={status} alt="" />
                <span className="font-ca-mono text-[0.625rem] uppercase tracking-[0.12em] text-ca-400">{label}</span>
              </div>
            ))}
            <div className="relative h-[0.8125rem] w-[0.8125rem]">
              <Presence status="online" />
            </div>
          </ThemePair>
        </Sample>
      </Section>

      <Section
        id="ca-overlays"
        kicker="ChatApp"
        title="Modal y popover"
        lead="Las dos capas flotantes. Ambas son absolute, no fixed: viven dentro del root .ca-app para heredar el tema y no escapar del shell de SmartRotom (que es de altura fija y con overflow oculto)."
      >
        <Sample
          app="ca"
          title="Modal + ModalFoot"
          code="title · icon · wide · foot"
          padded={false}
          note={
            <>
              Se cierra con clic fuera y con Escape. Como es <code>absolute inset-0</code>, necesita un ancestro{" "}
              <code>relative</code> — aquí es el escenario de abajo; en la app, el root de ChatApp.
            </>
          }
        >
          <ThemePair stack>
            <div className="relative h-[22.5rem] w-full overflow-hidden rounded-[12px] bg-ca-wallpaper">
              <div className="ca-doodle pointer-events-none absolute inset-0" />
              {modal ? (
                <Modal
                  title="Ajustes"
                  icon="settings"
                  onClose={() => setModal(false)}
                  foot={
                    <ModalFoot>
                      <Button variant="ghost" onClick={() => setModal(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => setModal(false)}>Guardar</Button>
                    </ModalFoot>
                  }
                >
                  <div className="flex flex-col gap-4">
                    <Field defaultValue="Equipo Wingull" />
                    <label className="flex items-center gap-3 text-[0.90625rem] text-ca-100">
                      <Toggle on={notif} onClick={() => setNotif((s) => !s)} />
                      Silenciar notificaciones
                    </label>
                    <p className="text-[0.8125rem] leading-[1.5] text-ca-400">
                      El cuerpo desplaza con <code className="font-ca-mono text-[0.75rem]">.ca-scroll</code>; la cabecera y
                      el pie quedan fijos.
                    </p>
                  </div>
                </Modal>
              ) : (
                <div className="relative grid h-full place-items-center">
                  <Button onClick={() => setModal(true)}>Abrir modal</Button>
                </div>
              )}
            </div>
          </ThemePair>
        </Sample>

        <Sample
          app="ca"
          title="Popover + PopItem"
          code="Popover · PopItem"
          padded={false}
          note={
            <>
              Por defecto abre hacia arriba (<code>bottom: 100% + 10px</code>) porque su origen natural es el redactor,
              que vive al fondo. El consumidor la posiciona en el eje horizontal con <code>className</code>.
            </>
          }
        >
          <ThemePair>
            <div className="relative flex h-[18.75rem] w-full items-end rounded-[12px] bg-ca-header p-4">
              <div className="relative">
                <IconButton icon="paperclip" iconSize={20} title="Adjuntar" active />
                <Popover className="left-0 min-w-[14.5rem]">
                  <PopItem>
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-ca-accent/[.18] text-ca-accent">
                      <Icon name="image" size={18} />
                    </span>
                    <span>
                      <span className="block text-[0.875rem] font-medium text-ca-50">Fotos y vídeos</span>
                      <span className="text-[0.71875rem] text-ca-400">Galería de capturas</span>
                    </span>
                  </PopItem>
                  <PopItem>
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-ca-info/[.18] text-ca-info">
                      <Icon name="file" size={18} />
                    </span>
                    <span>
                      <span className="block text-[0.875rem] font-medium text-ca-50">Documento</span>
                      <span className="text-[0.71875rem] text-ca-400">Tus notas</span>
                    </span>
                  </PopItem>
                  <PopItem>
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-ca-highlight/[.18] text-ca-highlight">
                      <Icon name="mappin" size={18} />
                    </span>
                    <span>
                      <span className="block text-[0.875rem] font-medium text-ca-50">Ubicación</span>
                      <span className="text-[0.71875rem] text-ca-400">Compartir waypoint</span>
                    </span>
                  </PopItem>
                </Popover>
              </div>
            </div>
          </ThemePair>
        </Sample>
      </Section>

      <Section
        id="ca-estados"
        kicker="ChatApp"
        title="Carga y contadores"
        lead="Nada de ruletas girando. La carga tiene la forma del contenido que va a llegar, y los dos indicadores vivos —contador de no leídos y puntos de «escribiendo»— son los que llevan el pulso de la app."
      >
        <Sample
          app="ca"
          title="Skeleton"
          code="className · style"
          padded={false}
          note="Es un shimmer sin forma propia: la forma la da la clase. Se apaga con prefers-reduced-motion."
        >
          <ThemePair>
            <div className="flex w-full max-w-[23.75rem] flex-col gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-[0.8125rem]">
                  <Skeleton className="h-[3.0625rem] w-[3.0625rem] flex-none rounded-full" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-3.5 w-1/2" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          </ThemePair>
        </Sample>

        <Sample
          app="ca"
          title="CountBadge"
          code="count"
          padded={false}
          note="Píldora de acento con el texto en on-accent. No trunca: un 1200 se ensancha, porque el diseño prefiere un número honesto a un 99+."
        >
          <ThemePair>
            <CountBadge count={1} />
            <CountBadge count={12} />
            <CountBadge count={99} />
            <CountBadge count={1200} />
          </ThemePair>
        </Sample>

        <Sample
          app="ca"
          title="Dots"
          code="sm"
          padded={false}
          note="Hereda currentColor, así que sirve tanto en la fila de contacto (acento suave) como dentro de una burbuja."
        >
          <ThemePair>
            <span className="inline-flex items-center gap-2 text-ca-accent-soft">
              <Dots />
              <span className="text-[0.875rem]">escribiendo…</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-ca-400">
              <Dots sm />
              <span className="text-[0.8125rem]">Marta está escribiendo</span>
            </span>
          </ThemePair>
        </Sample>
      </Section>
    </>
  )
}
