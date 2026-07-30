"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { MONO_LABEL, Sample, Section } from "../../showcase-shared"
import { Banner, Button, Checkbox, Field, IconButton, Input, Menu, Modal, Popover, Select, toast } from "@boffmedia/ui"

export function MenusSections() {
  const [modalOpen, setModalOpen] = React.useState(false)
  const [bannerOpen, setBannerOpen] = React.useState(true)
  return (
    <Section
      id="menus"
      kicker="Primitivas"
      title="Menús y avisos"
      lead={<>Cuatro capas de superposición: el menú de acciones (<code>Menu</code> / alias <code>Dropdown</code>), el <code>Popover</code> para filtros y detalles, el <code>Modal</code> para formularios y confirmaciones, y el <code>Toast</code> como aviso efímero. Todos comparten teclado completo, cierre con <code>Escape</code> y clic fuera.</>}
    >
      <Sample title="Menú de acciones" code="<Menu label items align>" note={<>Trigger con <code>aria-haspopup</code>; separadores y acción destructiva. Prueba a abrirlo con el teclado.</>}>
        <Menu
          label="Acciones"
          items={[
            { label: "Editar equipo", icon: "edit", onSelect: () => toast("Abriendo editor…") },
            { label: "Duplicar", icon: "copy", shortcut: "⌘D", onSelect: () => toast({ tone: "ok", msg: "Equipo duplicado." }) },
            { label: "Compartir enlace", icon: "link", onSelect: () => toast({ tone: "info", msg: "Enlace copiado al portapapeles." }) },
            { sep: true },
            { label: "Archivar", icon: "inbox", disabled: true },
            { label: "Eliminar", icon: "trash", danger: true, onSelect: () => toast({ tone: "bad", title: "Eliminado", msg: "El equipo se movió a la papelera." }) },
          ]}
        />
        <Menu
          variant="pri"
          label="Exportar"
          icon="download"
          items={[
            { label: "Como imagen (PNG)", icon: "eye", onSelect: () => toast("Exportando PNG…") },
            { label: "Copiar Showdown", icon: "copy", onSelect: () => toast({ tone: "ok", msg: "Set copiado en formato Showdown." }) },
            { label: "Enlace público", icon: "link", onSelect: () => toast({ tone: "info", msg: "Enlace público generado." }) },
          ]}
        />
        <Menu
          trigger={<IconButton name="settings" label="Opciones" />}
          align="end"
          ariaLabel="Opciones"
          items={[
            { label: "Ajustes", icon: "settings", onSelect: () => {} },
            { label: "Ayuda", icon: "info", onSelect: () => {} },
            { sep: true },
            { label: "Cerrar sesión", icon: "back", onSelect: () => toast({ tone: "warn", msg: "Sesión cerrada." }) },
          ]}
        />
      </Sample>
      <Sample
        title="Popover"
        code="<Popover trigger align side>"
        note={<>Contenedor flotante anclado al disparador; cierra con <code>Escape</code> o clic fuera. A diferencia del <code>Menu</code>, admite cualquier contenido — filtros, un detalle, un mini formulario.</>}
      >
        <Popover
          ariaLabel="Filtros"
          trigger={
            <Button size="sm" icon="filter" iconRight="chevronDown">
              Filtros
            </Button>
          }
        >
          {({ close }) => (
            <div className="grid gap-[14px]">
              <span className={cn(MONO_LABEL, "text-txt-dim")}>Formato</span>
              <div className="grid gap-[10px]">
                <Checkbox defaultChecked label="VGC" />
                <Checkbox label="Singles" />
                <Checkbox label="Draft" />
              </div>
              <Button size="sm" variant="pri" onClick={close}>
                Aplicar
              </Button>
            </div>
          )}
        </Popover>
        <Popover align="end" ariaLabel="Detalle de jugador" trigger={<IconButton name="info" label="Detalle" />}>
          <div className="grid gap-[6px] min-w-[220px]">
            <b className="font-display text-[15px] not-italic uppercase tracking-[0.02em]">AxelCraft</b>
            <span className="text-txt-muted text-[13px]">Equipo Volt · 12 480 pts · 3 logros</span>
          </div>
        </Popover>
      </Sample>
      <Sample
        title="Diálogo modal"
        code="<Modal open onClose title footer>"
        note={<>Para formularios y confirmaciones: foco atrapado, <code>Escape</code> y clic en el velo cierran, y el scroll del fondo se bloquea. La esquina superior lleva el corte de 16px.</>}
      >
        <Button variant="pri" icon="edit" onClick={() => setModalOpen(true)}>
          Abrir diálogo
        </Button>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Nuevo equipo"
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="pri"
                size="sm"
                icon="check"
                onClick={() => {
                  setModalOpen(false)
                  toast({ tone: "ok", title: "Equipo creado", msg: "El equipo se añadió a tu perfil." })
                }}
              >
                Guardar
              </Button>
            </>
          }
        >
          <div className="grid gap-4">
            <Field label="Nombre del equipo" hint="Visible en tu perfil público.">
              <Input placeholder="Volt Turno" />
            </Field>
            <Field label="Formato">
              <Select
                value="vgc"
                onChange={() => {}}
                options={[
                  { value: "vgc", label: "Pokémon VGC" },
                  { value: "singles", label: "Singles" },
                  { value: "draft", label: "Draft" },
                ]}
              />
            </Field>
          </div>
        </Modal>
      </Sample>
      <Sample title="Avisos (toast)" code="toast({ tone, title, msg, action })" note={<>Se apilan abajo-derecha y se autodescartan; máximo cuatro en pantalla. El tono tiñe el borde y el icono.</>}>
        <Button size="sm" onClick={() => toast({ tone: "ok", title: "Guardado", msg: "Tus cambios están seguros." })}>
          Éxito
        </Button>
        <Button size="sm" onClick={() => toast({ tone: "bad", title: "Error", msg: "No se pudo conectar con el servidor." })}>
          Error
        </Button>
        <Button size="sm" onClick={() => toast({ tone: "warn", msg: "Tu sesión caduca en 2 minutos." })}>
          Aviso
        </Button>
        <Button size="sm" onClick={() => toast({ tone: "info", msg: "Nueva regulación disponible.", action: { label: "Ver", onClick: () => {} } })}>
          Con acción
        </Button>
      </Sample>
      <Sample
        title="Banner de aviso"
        code="<Banner tone title actions onClose>"
        col
        note={<>El aviso persistente en línea — frente al <code>Toast</code> efímero. Cuatro tonos, icono automático por tono, y ranuras opcionales de <code>actions</code> y cierre.</>}
      >
        <div className="grid gap-3 w-full max-w-[520px]">
          {bannerOpen && (
            <Banner tone="info" title="Regulación H activa" onClose={() => setBannerOpen(false)}>
              Los equipos deben cumplir la lista de la temporada actual.
            </Banner>
          )}
          {!bannerOpen && (
            <Button size="sm" variant="ghost" icon="refresh" onClick={() => setBannerOpen(true)}>
              Restaurar banner
            </Button>
          )}
          <Banner tone="success" title="Equipo validado">
            Los seis Pokémon cumplen la regulación.
          </Banner>
          <Banner
            tone="warn"
            title="Faltan datos"
            actions={
              <Button size="sm" variant="ghost">
                Completar
              </Button>
            }
          >
            Añade los EVs para calcular rangos exactos.
          </Banner>
          <Banner tone="error" title="Set no permitido">
            Incineroar con Intimidación está restringido en este formato.
          </Banner>
        </div>
      </Sample>
    </Section>
  )
}
