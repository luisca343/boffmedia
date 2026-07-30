"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Sample, Section } from "../../showcase-shared"
import { DEMO_NOTIFS } from "../../showcase-data"
import { Button, Crumbs, Pagination, Seg, Tabs } from "@boffmedia/ui"
import { AccountMenu } from "@/components/boffmedia/ui/navigation/AccountNav"
import { LangSwitcher } from "@/components/boffmedia/ui/navigation/LangSwitcher"
import { NavDropdown } from "@/components/boffmedia/ui/navigation/NavDropdown"
import { NotifMenu } from "@/components/boffmedia/ui/navigation/NotifMenu"
import { buildComunidadSections, buildToolsSections } from "@/components/boffmedia/ui/navigation/nav-data"

export function NavegacionSections() {
  const t = useTranslations()
  const toolsSections = React.useMemo(() => buildToolsSections(t), [t])
  const comunidadSections = React.useMemo(() => buildComunidadSections(t), [t])
  const [tab, setTab] = React.useState("uso")
  const [seg, setSeg] = React.useState("dia")
  const [pg, setPg] = React.useState(4)
  return (
    <>
      <Section id="navegacion" kicker="Primitivas" title="Navegación">
        <Sample title="Pestañas" code="<Tabs>" col>
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "uso", label: "Uso", count: 128 },
              { value: "leads", label: "Leads", count: 64 },
              { value: "cores", label: "Parejas", count: 32 },
            ]}
          />
        </Sample>
        <Sample title="Segmentado" code="<Seg>">
          <Seg value={seg} onChange={setSeg} options={[{ value: "dia", label: "Día" }, { value: "semana", label: "Semana" }, { value: "mes", label: "Mes" }]} />
        </Sample>
        <Sample title="Miga de pan" code="<Crumbs>">
          <Crumbs items={[{ label: "Herramientas", href: "#" }, { label: "Pokémon", href: "#" }, { label: "Calculadora de daño" }]} />
        </Sample>
        <Sample title="Paginación" code="<Pagination page total onChange>" note={<>Trunca con elipsis alrededor de la actual; números en mono con cero a la izquierda.</>}>
          <Pagination page={pg} total={12} onChange={setPg} />
        </Sample>
      </Section>

      <Section
        id="navdrop"
        kicker="Primitivas"
        title="Dropdown de nav"
        lead={<>El menú del navbar (<code>NavDropdown</code>): abre al pasar el cursor y el clic en el disparador navega al hub. Formato partido — carril de juegos a la izquierda; al pasar el cursor la hoja muestra sus herramientas agrupadas por categoría, con cabecera que navega a su hub. Se alimenta del registro de navegación (<code>buildToolsSections</code> deriva del registro <code>data/games</code>): añadir un juego o herramienta ahí lo hace aparecer aquí, en el hub y en la barra lateral sin tocar el navbar.</>}
      >
        <Sample title="Herramientas — juego → categorías" code="<NavDropdown demoOpen sections>" col note={<>Cada cabecera de categoría navega a su hub; la fila de juego navega a su página. Fijado abierto para la demo — arriba en la barra abre al pasar el cursor.</>}>
          <div className="w-full overflow-x-auto">
            <NavDropdown demoOpen label="Herramientas" href="/herramientas" sections={toolsSections} />
          </div>
        </Sample>
        <Sample title="Comunidad — todo agrupado" code="buildComunidadSections" col note={<>Mismo formato para el menú de Comunidad.</>}>
          <div className="w-full overflow-x-auto">
            <NavDropdown demoOpen label="Comunidad" href="/comunidad" sections={comunidadSections} />
          </div>
        </Sample>
      </Section>

      <Section
        id="navbar"
        kicker="Primitivas"
        title="Sesión e idioma"
        lead={<>Las piezas de la derecha del navbar, todas reutilizables: el conmutador de idioma (<code>LangSwitcher</code>), las notificaciones (<code>NotifMenu</code>) y los accesos de cuenta. Comparten el sistema de avisos <code>toast()</code>.</>}
      >
        <Sample title="Conmutador de idioma" code="<LangSwitcher>" note={<>Globo + segmentado ES/EN; el idioma activo se enciende en acento y persiste.</>}>
          <LangSwitcher />
        </Sample>
        <Sample title="Notificaciones" code="<NotifMenu>" note={<>Campana con contador de no leídas; el popover permite marcar leídas y limpiar, con estado vacío. Ábrela.</>}>
          <NotifMenu initialItems={DEMO_NOTIFS} />
        </Sample>
        <Sample title="Cuenta — con sesión" code="<AccountNav> · con sesión" note={<>Avatar + nombre → menú de cuenta (perfil, cerrar sesión). Ábrelo. En la barra real aparece cuando hay sesión iniciada.</>}>
          <AccountMenu user={{ name: "RotomChef", email: "rotomchef@boffmedia.gg", image: null }} />
        </Sample>
        <Sample title="Cuenta — sin sesión" code="<AccountNav> · sin sesión" note={<>Sin sesión, <code>AccountNav</code> muestra Entrar / Crear cuenta.</>}>
          <Button size="sm" variant="ghost" icon="user" href="/entrar">
            Entrar
          </Button>
          <Button size="sm" variant="pri" icon="plus" href="/entrar?mode=register">
            Crear cuenta
          </Button>
        </Sample>
      </Section>
    </>
  )
}
