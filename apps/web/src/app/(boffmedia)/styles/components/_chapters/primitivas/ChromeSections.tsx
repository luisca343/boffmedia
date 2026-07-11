"use client"

import { Sample, Section } from "../../showcase-shared"
import { AuthProviderBtn, Badge, Clock, Divider, Field, PasswordField } from "@/components/boffmedia/primitives"
import { AuthScreen } from "@/components/boffmedia/ui/auth/AuthScreen"
import { Footer, FooterCol, FooterSocial } from "@/components/boffmedia/ui/layout/Footer"

export function ChromeSections() {
  return (
    <>
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
    </>
  )
}
