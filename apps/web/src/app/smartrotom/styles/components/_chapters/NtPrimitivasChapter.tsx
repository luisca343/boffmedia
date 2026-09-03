"use client"

import * as React from "react"
import { Sample, Section } from "../showcase-shared"
import {
  Button,
  ContextMenu,
  Icon,
  IconButton,
  Kbd,
  MiniTag,
  MODAL_PANEL,
  Overlay,
  ToastHost,
  Tooltip,
  toast,
  type MenuState,
} from "../../../notas/_components/ui"
import { NotesThemeProvider } from "../../../notas/_hooks/useNotesTheme"
import { COLOR_KEYS } from "../../../notas/_utils/colors"

const TAG_LABELS: Record<string, string> = {
  primary: "proyecto",
  secondary: "referencia",
  accent: "idea",
  success: "hecho",
  warning: "revisar",
  error: "bloqueado",
  info: "lectura",
}

function Botones() {
  return (
    <>
      <Button variant="primary">
        <Icon name="plus" size={15} />
        Nueva nota
      </Button>
      <Button variant="ghost">
        <Icon name="share" size={15} />
        Compartir
      </Button>
      <Button variant="ghost" disabled>
        Guardando…
      </Button>
      <span className="mx-1 h-6 w-px bg-nt-border" />
      <IconButton aria-label="Buscar">
        <Icon name="search" size={16} />
      </IconButton>
      <IconButton active aria-label="Fijar">
        <Icon name="pin" size={16} />
      </IconButton>
      <IconButton aria-label="Más">
        <Icon name="more-v" size={16} />
      </IconButton>
    </>
  )
}

function Ayudas() {
  const [menu, setMenu] = React.useState<MenuState | null>(null)

  // The real invocation: a row raises the menu at the pointer (NoteList.tsx), so the
  // coordinates are viewport coordinates and the panel is portaled to <body>.
  const open = (e: React.MouseEvent) => {
    e.preventDefault()
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { icon: "pencil", label: "Renombrar" },
        { icon: "pin", label: "Fijar arriba" },
        { icon: "copy", label: "Duplicar" },
        { sep: true },
        { icon: "trash", label: "Mover a la papelera", danger: true },
      ],
    })
  }

  return (
    <>
      <Tooltip label="Buscar en las notas">
        <IconButton aria-label="Buscar">
          <Icon name="search" size={16} />
        </IconButton>
      </Tooltip>
      <Tooltip label="Historial de versiones" side="top">
        <IconButton aria-label="Historial">
          <Icon name="history" size={16} />
        </IconButton>
      </Tooltip>

      <div
        onContextMenu={open}
        className="ml-2 flex cursor-context-menu items-center gap-2.5 rounded-nt-md border border-nt-border bg-nt-panel px-3 py-[0.6875rem] text-[0.84375rem] text-nt-fg"
      >
        <Icon name="file-text" size={15} className="text-nt-fg-subtle" />
        Arquitectura de Notas
        <span className="ml-2 text-[0.6875rem] text-nt-fg-subtle">clic derecho</span>
        <IconButton aria-label="Acciones" onClick={open}>
          <Icon name="more" size={15} />
        </IconButton>
      </div>

      {menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />}
    </>
  )
}

function Overlays() {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Icon name="zap" size={15} />
        Captura rápida
      </Button>
      <Button variant="ghost" onClick={() => toast("Nota guardada")}>
        Aviso · éxito
      </Button>
      <Button variant="ghost" onClick={() => toast("Sincronizando el grafo…", "info")}>
        Aviso · info
      </Button>
      <Button variant="ghost" onClick={() => toast("La nota tiene cambios sin guardar", "warn")}>
        Aviso · alerta
      </Button>
      <Button variant="ghost" onClick={() => toast("No se pudo guardar", "error")}>
        Aviso · error
      </Button>

      {open && (
        <Overlay onClose={() => setOpen(false)}>
          <div className={`${MODAL_PANEL} mt-[16vh] w-[33.75rem] max-w-[92vw]`}>
            <div className="flex items-center gap-2.5 border-b border-nt-border px-4 py-3">
              <Icon name="zap" size={16} className="text-nt-accent-fg" />
              <span className="flex-1 text-[0.875rem] font-[550] text-nt-fg">Captura rápida</span>
              <Kbd>Esc</Kbd>
            </div>
            <div className="px-4 py-5 text-[0.84375rem] leading-[1.6] text-nt-fg-muted">
              El hijo aporta su propio panel: <code className="font-nt-mono text-[0.75rem] text-nt-accent-fg">MODAL_PANEL</code>{" "}
              es la cadena de clases del cristal, y <code className="font-nt-mono text-[0.75rem] text-nt-accent-fg">Overlay</code>{" "}
              sólo pone el velo, el Escape y el cierre por clic fuera.
            </div>
            <div className="flex justify-end gap-2 border-t border-nt-border bg-nt-panel-2 px-4 py-3">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setOpen(false)
                  toast("Nota creada")
                }}
              >
                Crear
              </Button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Fixed to the viewport corner but NOT portaled: it must sit inside a `.nt-app`
          root or its tokens have nothing to resolve against. */}
      <ToastHost />
    </>
  )
}

export function NtPrimitivasChapter() {
  return (
    // Overlay and ContextMenu portal to <body> and re-theme themselves with
    // `ThemedLayer`, which reads the notes theme context — without this provider they
    // throw on mount. It also means the portaled layers follow the user's saved tweaks
    // (localStorage `nt-tweaks`), not the theme of the specimen that opened them.
    <NotesThemeProvider>
      <Section
        id="nt-botones"
        kicker="Notas"
        title="Botones"
        lead="Dos variantes y nada más: `primary` (degradado de la rampa naranja, con brillo interior) para la única acción que importa en cada superficie, y `ghost` para el resto. `IconButton` es la pieza del chrome —barras, cabeceras, barras de herramientas— y tiene estado `active`."
      >
        <Sample title="Variantes · oscuro" code="<Button> · <IconButton>" app="nt">
          <Botones />
        </Sample>
        <Sample
          title="Variantes · claro"
          code='data-theme="light"'
          app="nt"
          theme="light"
          note="El mismo componente: el naranja del acento se oscurece a `nt-600` en claro para mantener el contraste AA."
        >
          <Botones />
        </Sample>
      </Section>

      <Section
        id="nt-etiquetas"
        kicker="Notas"
        title="Etiquetas y teclas"
        lead="`MiniTag` es el único patrón de etiqueta: tinta a plena intensidad sobre el mismo tono al 14 %. El color llega como clave de categoría y se resuelve a un triplete RGB en estilo en línea, porque Tailwind no puede expresar un tinte arbitrario. `Kbd` es su vecino silencioso: la tecla."
      >
        <Sample
          title="Etiquetas"
          code="<MiniTag>"
          app="nt"
          note="Las siete claves de `_utils/colors.ts`. `removable` añade la cruz y expone `onRemove`; sin `onClick` la píldora no es interactiva (el cursor no cambia)."
        >
          {COLOR_KEYS.map((key) => (
            <MiniTag key={key} label={TAG_LABELS[key] ?? key} color={key} />
          ))}
          <MiniTag label="borrable" color="secondary" removable onRemove={() => toast("Etiqueta quitada", "info")} />
        </Sample>

        <Sample title="Teclas" code="<Kbd>" app="nt">
          <span className="flex items-center gap-2 text-[0.8125rem] text-nt-fg-muted">
            Paleta de comandos <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
          <span className="flex items-center gap-2 text-[0.8125rem] text-nt-fg-muted">
            Captura rápida <Kbd>⌘</Kbd>
            <Kbd>⇧</Kbd>
            <Kbd>N</Kbd>
          </span>
          <span className="flex items-center gap-2 text-[0.8125rem] text-nt-fg-muted">
            Cerrar <Kbd>Esc</Kbd>
          </span>
        </Sample>
      </Section>

      <Section
        id="nt-ayudas"
        kicker="Notas"
        title="Tooltip y menú"
        lead="Ayudas de puntero. `Tooltip` es local —se posiciona sobre su hijo, sin portal— y `ContextMenu` es lo contrario: se dibuja en coordenadas de viewport, portado a `<body>`, y se cierra con Escape o con el primer clic en cualquier sitio."
      >
        <Sample
          title="Tooltip y menú contextual"
          code="<Tooltip> · <ContextMenu>"
          app="nt"
          note="El menú se abre con clic derecho sobre la fila (como en la lista de notas) o con el botón «⋯». Sus ítems son datos: `{ icon, label, onClick, danger, sep }`."
        >
          <Ayudas />
        </Sample>
      </Section>

      <Section
        id="nt-overlays"
        kicker="Notas"
        title="Overlay y avisos"
        lead="`Overlay` es sólo el velo y el contrato de cierre; el panel lo trae el hijo con la cadena `MODAL_PANEL`. Los avisos van por un bus a nivel de módulo: cualquier componente llama a `toast()` sin pasar props, y un único `ToastHost` los pinta."
      >
        <Sample
          title="Modal y avisos"
          code="<Overlay> · MODAL_PANEL · toast()"
          app="nt"
          note="Ojo con lo portado: `Overlay` y `ContextMenu` cuelgan de `<body>`, fuera de la raíz `.nt-app`, así que sus tokens no resolverían. Por eso ambos se re-envuelven en `ThemedLayer` —un `display:contents` que reinyecta `.nt-app`, el `data-theme` y el acento en tiempo de ejecución—. Toda pieza portada nueva debe hacer lo mismo. `ToastHost`, en cambio, no está portado: es `position:fixed` dentro de la raíz."
        >
          <Overlays />
        </Sample>
      </Section>
    </NotesThemeProvider>
  )
}
