"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { DEMO_NOTIFS } from "../showcase-data"
import { MONO_LABEL, Sample, Section } from "../showcase-shared"
import { AuthProviderBtn } from "@/components/boffmedia/primitives/auth-provider-btn"
import { Avatar, AvatarGroup } from "@/components/boffmedia/primitives/avatar"
import { Badge } from "@/components/boffmedia/primitives/badge"
import { Banner } from "@/components/boffmedia/primitives/banner"
import { Button } from "@/components/boffmedia/primitives/button"
import { Checkbox } from "@/components/boffmedia/primitives/checkbox"
import { Chip } from "@/components/boffmedia/primitives/chip"
import { ChipGroup } from "@/components/boffmedia/primitives/chip-group"
import { Clock } from "@/components/boffmedia/primitives/clock"
import { CodeBlock } from "@/components/boffmedia/primitives/code-block"
import { Crumbs } from "@/components/boffmedia/primitives/crumbs"
import { Disclosure } from "@/components/boffmedia/primitives/disclosure"
import { Divider } from "@/components/boffmedia/primitives/divider"
import { Field } from "@/components/boffmedia/primitives/field"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { IconBox } from "@/components/boffmedia/primitives/icon-box"
import { IconButton } from "@/components/boffmedia/primitives/icon-button"
import { Input, Textarea } from "@/components/boffmedia/primitives/input"
import { Kbd } from "@/components/boffmedia/primitives/kbd"
import { Menu } from "@/components/boffmedia/primitives/menu"
import { Modal } from "@/components/boffmedia/primitives/modal"
import { OptionGroup } from "@/components/boffmedia/primitives/option-group"
import { Pagination } from "@/components/boffmedia/primitives/pagination"
import { PasswordField } from "@/components/boffmedia/primitives/password-field"
import { Popover } from "@/components/boffmedia/primitives/popover"
import { Progress } from "@/components/boffmedia/primitives/progress"
import { RadioGroup } from "@/components/boffmedia/primitives/radio-group"
import { Ring } from "@/components/boffmedia/primitives/ring"
import { SearchInput } from "@/components/boffmedia/primitives/search-input"
import { Seg } from "@/components/boffmedia/primitives/seg"
import { Select } from "@/components/boffmedia/primitives/select"
import { Skeleton } from "@/components/boffmedia/primitives/skeleton"
import { Slider } from "@/components/boffmedia/primitives/slider"
import { Spinner } from "@/components/boffmedia/primitives/spinner"
import { Tabs } from "@/components/boffmedia/primitives/tabs"
import { toast } from "@/components/boffmedia/primitives/toast"
import { Toggle } from "@/components/boffmedia/primitives/toggle"
import { Tooltip } from "@/components/boffmedia/primitives/tooltip"
import { AuthScreen } from "@/components/boffmedia/ui/auth/AuthScreen"
import { Footer, FooterCol, FooterSocial } from "@/components/boffmedia/ui/layout/Footer"
import { AccountMenu } from "@/components/boffmedia/ui/navigation/AccountNav"
import { LangSwitcher } from "@/components/boffmedia/ui/navigation/LangSwitcher"
import { NavDropdown } from "@/components/boffmedia/ui/navigation/NavDropdown"
import { NotifMenu } from "@/components/boffmedia/ui/navigation/NotifMenu"
import { buildComunidadSections, buildToolsSections } from "@/components/boffmedia/ui/navigation/nav-data"
import { useTranslations } from "next-intl"

export function PrimitivasChapter() {
  const t = useTranslations()
  const toolsSections = React.useMemo(() => buildToolsSections(t), [t])
  const comunidadSections = React.useMemo(() => buildComunidadSections(t), [t])
  const [busy, setBusy] = React.useState(false)
  const [busy2, setBusy2] = React.useState(false)
  const [fchips, setFchips] = React.useState(["VGC", "Singles", "Clima", "Compartir"])
  const [tglA, setTglA] = React.useState(true)
  const [tglB, setTglB] = React.useState(false)
  const [sq, setSq] = React.useState("")
  const [ck1, setCk1] = React.useState(true)
  const [rad, setRad] = React.useState("dobles")
  const [rng, setRng] = React.useState(64)
  const [tab, setTab] = React.useState("uso")
  const [seg, setSeg] = React.useState("dia")
  const [pg, setPg] = React.useState(4)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [chipG, setChipG] = React.useState("todos")
  const [chipM, setChipM] = React.useState<string[]>(["vgc", "clima"])
  const [opt, setOpt] = React.useState("dobles")
  const [optM, setOptM] = React.useState<string[]>(["protect"])
  const [bannerOpen, setBannerOpen] = React.useState(true)
  return (
    <>
            <Section id="botones" kicker="Primitivas" title="Botones">
              <Sample title="Variantes" code="<Button variant size icon>">
                <Button variant="pri">Primario</Button>
                <Button>Secundario</Button>
                <Button variant="ghost">Fantasma</Button>
                <Button variant="danger">Peligro</Button>
                <Button variant="pri" disabled>
                  Deshabilitado
                </Button>
              </Sample>
              <Sample title="Tamaños e iconos">
                <Button variant="pri" size="lg" iconRight="arrow">
                  Explorar juegos
                </Button>
                <Button variant="pri" iconRight="arrow">
                  Inscribirse
                </Button>
                <Button size="sm" icon="download">
                  Exportar
                </Button>
                <IconButton name="search" label="Buscar" />
                <IconButton name="bell" label="Notificaciones" />
                <IconButton name="settings" label="Ajustes" />
              </Sample>
              <Sample
                title="Estado de carga"
                code="<Button loading>"
                note={
                  <>
                    Click → estado ocupado: el spinner sustituye la etiqueta sin cambiar el ancho, marca <code>aria-busy</code> y bloquea la interacción.
                  </>
                }
              >
                <Button
                  variant="pri"
                  icon="download"
                  loading={busy}
                  onClick={() => {
                    setBusy(true)
                    setTimeout(() => {
                      setBusy(false)
                      toast({ tone: "ok", title: "Exportado", msg: "El equipo se guardó en tu perfil." })
                    }, 1800)
                  }}
                >
                  {busy ? "Guardando…" : "Probar loading"}
                </Button>
                <Button icon="refresh" loading={busy2} onClick={() => { setBusy2(true); setTimeout(() => setBusy2(false), 1800) }}>
                  {busy2 ? "Sincronizando…" : "Sincronizar"}
                </Button>
                <Button variant="pri" loading>
                  Cargando
                </Button>
              </Sample>
            </Section>

            <Section id="chips" kicker="Primitivas" title="Chips y badges">
              <Sample title="Chips" code="<Chip on>" note={<>Chips filtran y etiquetan; con <code>on</code> se encienden en naranja.</>}>
                <Chip>Sincronización en vivo</Chip>
                <Chip>Multiplataforma</Chip>
                <Chip on>VGC</Chip>
                <Chip onClick={() => {}}>Minecraft</Chip>
              </Sample>
              <Sample title="Badges de estado" code="<Badge tone>">
                <Badge tone="live">En vivo</Badge>
                <Badge tone="new">Nuevo</Badge>
                <Badge>Próximo</Badge>
                <Badge tone="ok">Activo</Badge>
                <Badge tone="warn">Pendiente</Badge>
                <Badge tone="bad">Cerrado</Badge>
                <Badge tone="info">Beta</Badge>
              </Sample>
              <Sample title="Chips descartables" code="<Chip on onRemove>" note={<>Para filtros activos: la ✕ quita el chip sin disparar el chip entero.</>}>
                {fchips.map((t) => (
                  <Chip key={t} on onRemove={() => setFchips((a) => a.filter((x) => x !== t))}>
                    {t}
                  </Chip>
                ))}
                {fchips.length === 0 && (
                  <Button size="sm" variant="ghost" icon="refresh" onClick={() => setFchips(["VGC", "Singles", "Clima", "Compartir"])}>
                    Restaurar filtros
                  </Button>
                )}
              </Sample>
              <Sample title="Avatares" code="<Avatar> · <AvatarGroup items max>">
                <Avatar>AX</Avatar>
                <Avatar accent>NV</Avatar>
                <Avatar lg>KR</Avatar>
                <AvatarGroup items={["AX", { label: "NV", accent: true }, "KR", "JR", "MG", "CL", "ZZ"]} max={5} />
              </Sample>
              <Sample title="Caja de icono" code="<IconBox icon tone size>" note={<>El patrón «icono en caja tintada»; los tonos semánticos siguen reservados a estado.</>}>
                <IconBox icon="sword" size="lg" />
                <IconBox icon="cards" tone="info" />
                <IconBox icon="check" tone="ok" />
                <IconBox icon="alert" tone="warn" size="sm" />
                <IconBox icon="tree" tone="muted" />
              </Sample>
              <Sample
                title="Grupo de chips"
                code="<ChipGroup label value onChange options multi>"
                col
                note={<>Filtro compacto en mono: exclusivo o <code>multi</code>. Cada opción admite <code>count</code> y un punto de <code>color</code>.</>}
              >
                <div className="grid gap-4 w-full max-w-[440px]">
                  <ChipGroup
                    label="Formato"
                    value={chipG}
                    onChange={(v) => setChipG(v as string)}
                    options={[
                      { value: "todos", label: "Todos", count: 224 },
                      { value: "vgc", label: "VGC", count: 128 },
                      { value: "singles", label: "Singles", count: 64 },
                      { value: "draft", label: "Draft", count: 32 },
                    ]}
                  />
                  <ChipGroup
                    label="Etiquetas (multi)"
                    multi
                    value={chipM}
                    onChange={(v) => setChipM(v as string[])}
                    options={[
                      { value: "vgc", label: "VGC", color: "hsl(18 90% 55%)" },
                      { value: "clima", label: "Clima", color: "hsl(200 80% 55%)" },
                      { value: "tr", label: "Trick Room", color: "hsl(265 60% 66%)" },
                      { value: "hyper", label: "Hyper Offense", color: "hsl(0 75% 60%)" },
                    ]}
                  />
                </div>
              </Sample>
            </Section>

            <Section id="formularios" kicker="Primitivas" title="Formularios">
              <Sample title="Campos" code="<Field> + <Input>" col>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Nombre de invocador" hint="Como aparece en el servidor.">
                    <Input placeholder="AxelCraft" />
                  </Field>
                  <Field label="Juego">
                    <Select
                      value="vgc"
                      onChange={() => {}}
                      options={[
                        { value: "vgc", label: "Pokémon VGC" },
                        { value: "mc", label: "Minecraft" },
                        { value: "mh", label: "Monster Hunter Wilds" },
                      ]}
                    />
                  </Field>
                  <Field label="Código de equipo" error="Ese código ya está en uso.">
                    <Input defaultValue="ROT-2026" />
                  </Field>
                  <Field label="Buscar">
                    <SearchInput value={sq} onChange={setSq} placeholder="Buscar jugador, evento…" />
                  </Field>
                </div>
              </Sample>
              <Sample title="Área de texto" code="<Field> + <Textarea>" col note={<>Entrada multilínea con el mismo chasis; crece en vertical con <code>resize</code>.</>}>
                <div className="w-full max-w-[440px]">
                  <Field label="Notas del equipo" hint="Visible solo para ti.">
                    <Textarea rows={3} placeholder="Anota leads, coberturas, ideas de EV…" />
                  </Field>
                </div>
              </Sample>
              <Sample title="Interruptores" code="<Toggle>">
                <Toggle on={tglA} onChange={setTglA} label="Notificaciones" />
                <Toggle on={tglB} onChange={setTglB} label="Modo retransmisión" />
              </Sample>
              <Sample title="Búsqueda" code="<SearchInput value onChange size>" col note={<>Chasis con botón de limpiar cuando hay texto; variante <code>sm</code> para barras densas.</>}>
                <div className="grid gap-3 w-full max-w-[400px]">
                  <SearchInput value={sq} onChange={setSq} placeholder="Buscar jugador, evento…" />
                  <SearchInput value={sq} onChange={setSq} size="sm" placeholder="Variante sm" />
                </div>
              </Sample>
              <Sample
                title="Desplegable"
                code="<Disclosure title icon sub badge>"
                col
                note={<>Contenedor plegable para ajustes avanzados y ayuda contextual; oculta el detalle hasta que se necesita. Admite <code>icon</code>, subtítulo y <code>badge</code>.</>}
              >
                <div className="grid gap-3 w-full max-w-[440px]">
                  <Disclosure title="Ajustes avanzados" icon="sliders" sub="EVs, IVs y naturaleza" badge="Opcional">
                    <div className="grid gap-3 pt-3">
                      <Field label="Naturaleza">
                        <Select
                          value="adamant"
                          onChange={() => {}}
                          options={[
                            { value: "adamant", label: "Firme (+Atq / −AtqEsp)" },
                            { value: "jolly", label: "Alegre (+Vel / −AtqEsp)" },
                            { value: "modest", label: "Modesta (+AtqEsp / −Atq)" },
                          ]}
                        />
                      </Field>
                      <Checkbox defaultChecked label="Sincronizar IVs perfectos" />
                    </div>
                  </Disclosure>
                  <Disclosure title="Cómo se calcula" icon="info">
                    <p className="pt-3 text-txt-muted text-[13px] leading-[1.6]">
                      El rango sale de aplicar la fórmula de daño con los modificadores activos: naturaleza, objeto, campo y clima.
                    </p>
                  </Disclosure>
                </div>
              </Sample>
            </Section>

            <Section
              id="seleccion"
              kicker="Primitivas"
              title="Selección y rango"
              lead={<>Checkbox para selección múltiple, Radio para elección exclusiva con descripción y Slider para rango. Los completan <code>Toggle</code> (encendido inmediato) y <code>OptionGroup</code> (tarjetas con icono). Marcadores del sistema: cuadro con corte y diamante.</>}
            >
              <Sample title="Checkbox" code="<Checkbox checked onChange label>" col>
                <div className="grid gap-3">
                  <Checkbox checked={ck1} onChange={setCk1} label="Recibir novedades por correo" />
                  <Checkbox defaultChecked label="Mostrar mi actividad a la comunidad" />
                  <Checkbox disabled label="Opción no disponible" />
                </div>
              </Sample>
              <Sample title="Radio" code="<RadioGroup value onChange options>" col>
                <div className="w-full max-w-[440px]">
                  <RadioGroup
                    value={rad}
                    onChange={setRad}
                    ariaLabel="Formato de combate"
                    options={[
                      { value: "singles", label: "Singles", desc: "Combate 1v1 clásico." },
                      { value: "dobles", label: "Dobles / VGC", desc: "El formato oficial por equipos." },
                      { value: "draft", label: "Draft", desc: "Selección por turnos." },
                    ]}
                  />
                </div>
              </Sample>
              <Sample title="Slider" code="<Slider value min max unit onChange>" col note={<>El valor va en mono naranja; aquí alimenta al <code>Progress</code> de abajo.</>}>
                <div className="grid gap-[18px] w-full max-w-[440px]">
                  <Slider label="Volumen de la señal" value={rng} onChange={setRng} unit="%" />
                  <Progress value={rng} />
                </div>
              </Sample>
              <Sample
                title="Tarjetas de opción"
                code="<OptionGroup options value onChange columns multi>"
                col
                note={<>Tarjetas con icono para elección exclusiva o <code>multi</code>; alternativa expresiva al <code>RadioGroup</code>. <code>columns</code> fija la rejilla.</>}
              >
                <div className="grid gap-4 w-full max-w-[520px]">
                  <OptionGroup
                    value={opt}
                    onChange={(v) => setOpt(v as string)}
                    columns={3}
                    ariaLabel="Formato de combate"
                    options={[
                      { value: "singles", icon: "sword", label: "Singles", sub: "1v1" },
                      { value: "dobles", icon: "users", label: "Dobles", sub: "VGC" },
                      { value: "draft", icon: "list", label: "Draft", sub: "Por turnos" },
                    ]}
                  />
                  <OptionGroup
                    multi
                    value={optM}
                    onChange={(v) => setOptM(v as string[])}
                    columns={2}
                    ariaLabel="Coberturas del equipo"
                    options={[
                      { value: "protect", icon: "shield", label: "Protect", sub: "Prioridad +4" },
                      { value: "fake", icon: "zap", label: "Fake Out", sub: "Amedrenta" },
                    ]}
                  />
                </div>
              </Sample>
            </Section>

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

            <Section
              id="pie"
              kicker="Primitivas"
              title="Pie de página"
              lead={<>El <code>Footer</code> del shell: cierre de emisión con rejilla de columnas y barra base con reloj en vivo. Se adapta al tema claro/oscuro con tokens — nada de grises fijos. Se descompone en dos piezas reutilizables: <code>FooterCol</code> (columna de enlaces con chevron revelado) y <code>FooterSocial</code> (cuadros sociales de corte diagonal).</>}
            >
              <Sample title="Pie completo" code="<Footer>" col note={<>Ancho completo del shell; marca con sociales, columnas theme-aware y barra base con reloj vivo y ubicación.</>}>
                <div className="w-full border border-solid border-line overflow-hidden [&_footer]:!mt-0">
                  <Footer />
                </div>
              </Sample>
              <Sample title="Columna de enlaces" code="<FooterCol title links>" note={<>Cabecera en display + lista con chevron que aparece y desplaza al pasar el cursor.</>}>
                <div className="min-w-[200px]">
                  <FooterCol
                    title="Explorar"
                    links={[
                      { route: "/eventos", label: "Eventos" },
                      { route: "/juegos", label: "Juegos" },
                      { route: "/herramientas", label: "Herramientas" },
                      { href: "https://discord.gg/TWqjNHQz7d", label: "Discord", external: true },
                    ]}
                  />
                </div>
              </Sample>
              <Sample title="Enlaces sociales" code="<FooterSocial items>" note={<>Fila de cuadros con corte diagonal; al pasar el cursor se rellenan en acento y se elevan.</>}>
                <FooterSocial
                  items={[
                    { icon: "discord", label: "Discord", href: "https://discord.gg/TWqjNHQz7d" },
                    { icon: "globe", label: "Web", href: "/" },
                  ]}
                />
              </Sample>
              <Sample title="Reloj en vivo" code="<Clock>" note={<>El reloj de la barra base del pie: se actualiza cada segundo y usa cifras tabulares para no descuadrar. Suelto, sirve para cualquier marca de tiempo en directo.</>}>
                <span className="inline-flex items-center gap-[10px] font-mono text-[13px] tracking-[0.08em] text-txt-muted">
                  <Badge tone="live">En vivo</Badge>
                  <Clock className="text-accent" />
                </span>
              </Sample>
            </Section>

            <Section
              id="acceso"
              kicker="Primitivas"
              title="Acceso"
              lead={<>Las piezas de la pantalla de entrada, reutilizables sueltas: botones de proveedor (<code>AuthProviderBtn</code>), el campo de contraseña con mostrar/ocultar (<code>PasswordField</code>) y el separador con etiqueta (<code>Divider</code>). La pantalla completa vive en <code>/entrar</code>.</>}
            >
              <Sample title="Botón de proveedor" code="<AuthProviderBtn provider>" note={<>Marcas fuertes (Discord, Steam) → relleno de marca; el resto → chasis neutro con la marca en el icono. Los no conectados van en estado <code>soon</code>. <code>block</code> ocupa el ancho.</>}>
                <div className="grid w-full max-w-[360px] gap-2.5">
                  <AuthProviderBtn provider="discord" soon block>
                    Discord
                  </AuthProviderBtn>
                  <div className="grid grid-cols-2 gap-2.5">
                    <AuthProviderBtn provider="google">Google</AuthProviderBtn>
                    <AuthProviderBtn provider="steam" soon>
                      Steam
                    </AuthProviderBtn>
                  </div>
                </div>
              </Sample>

              <Sample title="Separador" code="<Divider label>" col note={<>Separador horizontal; con <code>label</code>, texto centrado en mono entre dos líneas.</>}>
                <div className="grid w-full max-w-[360px] gap-4">
                  <Divider />
                  <Divider label="o con tu correo" />
                </div>
              </Sample>

              <Sample title="Contraseña" code="<PasswordField>" col note={<>Input de contraseña con botón mostrar/ocultar (<code>aria-pressed</code>).</>}>
                <div className="w-full max-w-[360px]">
                  <Field label="Contraseña">
                    <PasswordField defaultValue="supersecreto" />
                  </Field>
                </div>
              </Sample>

              <Sample title="Pantalla completa" code="/entrar" col note={<>La pantalla real: proveedores (Google + Discord/Steam «próximamente»), formulario de credenciales y cambio login ↔ registro. Conectada a NextAuth.</>}>
                <div className="w-full overflow-hidden border border-solid border-line [&>div]:!min-h-[560px]">
                  <AuthScreen />
                </div>
              </Sample>
            </Section>

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

            <Section
              id="indicadores"
              kicker="Primitivas"
              title="Anillo y carga"
              lead={<><code>Ring</code> es el progreso radial (logros, colecciones); <code>Spinner</code> es la carga indeterminada; <code>Skeleton</code> es la base genérica de carga que cada herramienta especializa. Complementan al <code>Progress</code> lineal de «Selección y rango».</>}
            >
              <Sample title="Anillo de progreso" code="<Ring value size>">
                <Ring value={rng} size={92}>
                  {rng}%
                </Ring>
                <Ring value={100} size={92}>
                  <Icon name="check" size={26} />
                </Ring>
                <Ring value={38} size={72}>
                  38%
                </Ring>
              </Sample>
              <Sample title="Spinner" code="<Spinner size>" note={<>Hereda <code>currentColor</code>, así que se tiñe según el contexto (aquí, naranja de acento). Con <code>reduce-motion</code> late en vez de girar. Es el mismo que sustituye la etiqueta de un <code>Button loading</code>.</>}>
                <Spinner size={16} />
                <Spinner size={22} />
                <Spinner size={30} className="text-accent" />
                <span className="inline-flex items-center gap-[10px] text-txt-muted text-[14px] ml-2">
                  <Spinner size={14} /> Cargando datos…
                </span>
              </Sample>
              <Sample title="Skeleton" code="<Skeleton w h avatar>" col note={<>Se detiene con <code>reduce-motion</code>. Aquí, el esqueleto de una fila de jugador.</>}>
                <div className="flex gap-[14px] items-center w-full max-w-[420px]">
                  <Skeleton w={48} h={48} avatar />
                  <div className="flex-1 grid gap-2">
                    <Skeleton w="60%" h={13} />
                    <Skeleton w="92%" h={9} />
                    <Skeleton w="40%" h={9} />
                  </div>
                </div>
              </Sample>
            </Section>

            <Section
              id="ayudas"
              kicker="Primitivas"
              title="Tooltip y teclas"
              lead={<>Ayuda contextual al pasar el cursor o enfocar (<code>Tooltip</code>) y teclas físicas (<code>Kbd</code>) para documentar atajos. El tooltip es solo texto — nunca lleva acciones dentro.</>}
            >
              <Sample title="Tooltip" code="<Tooltip label side>" note={<>Aparece con retardo en hover y foco de teclado; se coloca con <code>side</code>: top · bottom · left · right.</>}>
                <Tooltip label="Añadir al equipo">
                  <Button size="sm" icon="plus">
                    Pasa el cursor
                  </Button>
                </Tooltip>
                <Tooltip label="Notificaciones" side="bottom">
                  <IconButton name="bell" label="Notificaciones" />
                </Tooltip>
                <Tooltip label="Sincronizado hace 2 min" side="right">
                  <Badge tone="ok">Activo</Badge>
                </Tooltip>
              </Sample>
              <Sample title="Teclas" code="<Kbd>">
                <span className="inline-flex gap-[6px] items-center">
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </span>
                <span className={cn(MONO_LABEL, "text-txt-dim normal-case tracking-[0.08em]")}>abre la paleta</span>
                <span className="inline-flex gap-[6px] items-center ml-[18px]">
                  <Kbd>/</Kbd>
                </span>
                <span className={cn(MONO_LABEL, "text-txt-dim normal-case tracking-[0.08em]")}>busca en componentes</span>
              </Sample>
            </Section>

            <Section
              id="scrollbar"
              kicker="Primitivas"
              title="Scrollbar"
              lead={<>Sistema global con tokens <code>--sb-*</code>: pista transparente y pulgar rectangular que se aviva al pasar el ratón o mientras hay scroll activo, y se enciende en naranja al arrastrarlo. Funciona en WebKit y Firefox, respeta ambos temas y no necesita clases — para regiones internas usa la clase <code>bm-scroll</code>.</>}
            >
              <Sample title="Región vertical" code="overflow-y-auto · bm-scroll" col note={<>Haz scroll dentro: el pulgar se aviva mientras te desplazas y vuelve a apagarse al parar.</>}>
                <div className="bm-scroll max-h-[200px] w-full overflow-y-auto border border-solid border-line bg-panel" aria-label="Registro de cambios">
                  {[
                    ["v3.4", "Calculadora de daño: soporte de teracristal"],
                    ["v3.3", "Clasificación: filtros por temporada"],
                    ["v3.2", "Perfil: vitrina de logros"],
                    ["v3.1", "Eventos: cuenta atrás en tarjetas"],
                    ["v3.0", "Rediseño «Señal»: lanzamiento"],
                    ["v2.9", "Foro: votos y menciones"],
                    ["v2.8", "Calendario: vista mensual"],
                    ["v2.7", "BattleSim: modo entrenamiento"],
                  ].map(([v, t]) => (
                    <div key={v} className="flex items-baseline gap-[14px] border-b border-solid border-line px-4 py-[11px] last:border-b-0">
                      <span className={cn(MONO_LABEL, "text-accent")}>{v}</span>
                      <span className="text-[14px] text-txt-muted">{t}</span>
                    </div>
                  ))}
                </div>
              </Sample>
              <Sample title="Región horizontal" code="overflow-x-auto · bm-scroll" col>
                <div className="bm-scroll w-full overflow-x-auto border border-solid border-line bg-panel px-4 pt-[14px] pb-[10px]" aria-label="Juegos">
                  <div className="flex w-max gap-2">
                    {["Pokémon VGC", "Minecraft", "Monster Hunter Wilds", "Pixelmon", "PMD: Sky", "Smash Ultimate", "Mario Kart", "Splatoon 3"].map((g) => (
                      <Chip key={g}>{g}</Chip>
                    ))}
                  </div>
                </div>
              </Sample>
              <Sample title="Estados del pulgar" code="--sb-idle · --sb-hover · --sb-drag" col note={<>Los tres tonos van pegados en contraste para que el paso reposo → hover no resulte brusco.</>}>
                <div className="grid w-full max-w-[420px] gap-3">
                  {[
                    ["var(--sb-idle)", "Reposo — discreto sobre el contenido"],
                    ["var(--sb-hover)", "Hover / scroll activo"],
                    ["var(--sb-drag)", "Arrastre — señal naranja"],
                  ].map(([c, l]) => (
                    <div key={l} className="flex items-center gap-[14px]">
                      <span className="h-1.5 w-16 flex-none" style={{ background: c }} />
                      <span className={MONO_LABEL}>{l}</span>
                    </div>
                  ))}
                </div>
              </Sample>
            </Section>
    </>
  )
}
