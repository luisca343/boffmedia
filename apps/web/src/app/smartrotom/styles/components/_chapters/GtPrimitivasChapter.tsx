"use client"

import * as React from "react"
import { Sample, Section } from "../showcase-shared"
import {
  Avatar,
  Badge,
  Bar,
  Button,
  Card,
  Empty,
  Field,
  Icon,
  PageHead,
  Panel,
  Select,
  Skeleton,
  Stamp,
  Stat,
  Sunken,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  TextArea,
} from "@/app/smartrotom/gobierno/_components/ui"

export function GtPrimitivasChapter() {
  const [text, setText] = React.useState("")
  const [motivo, setMotivo] = React.useState("")
  const [cat, setCat] = React.useState("griefing")

  return (
    <>
      <Section
        id="gt-botones"
        kicker="Gobierno de Teras"
        title="Botones y distintivos"
        lead="Seis tonos de botón y un distintivo cívico que sirve para todo: estado, gravedad, categoría y número de expediente."
      >
        <Sample title="Botones" code="Button · tone · size" app="gt">
          <Button tone="primary">Emitir multa</Button>
          <Button tone="gold" icon="award">
            Adjudicar
          </Button>
          <Button tone="danger" icon="alert">
            Escalar a busca
          </Button>
          <Button tone="ghost" icon="filter">
            Filtrar
          </Button>
          <Button tone="soft">Revisar</Button>
          <Button tone="plain">Cancelar</Button>
          <Button tone="ghost" size="icon" icon="printer" aria-label="Imprimir" />
          <Button tone="primary" disabled>
            Sin permisos
          </Button>
        </Sample>

        <Sample
          title="Distintivos"
          code="Badge · tone · solid · dot"
          app="gt"
          note="El significado nunca lo lleva sólo el color: un distintivo siempre trae su palabra. Los mapas de estado (`DENUNCIA_STATUS`, `MULTA_STATUS`, `SEVERITY`…) viven en `_utils/tones.ts` como clases literales — un nombre de clase construido en tiempo de ejecución no compila y desaparece en silencio."
        >
          <Badge tone="warn" dot>
            Pendiente
          </Badge>
          <Badge tone="info" dot>
            En revisión
          </Badge>
          <Badge tone="ok" dot>
            Resuelta
          </Badge>
          <Badge tone="danger" icon="alert" solid>
            Crítica
          </Badge>
          <Badge tone="urbanismo">Urbanismo</Badge>
          <Badge tone="justicia">Justicia</Badge>
          <Badge tone="gold" icon="star">
            Oficial
          </Badge>
          <Badge tone="default">EXP-0042</Badge>
        </Sample>

        <Sample
          title="El sello estampado"
          code="Stamp"
          app="gt"
          note="El veredicto sobre un expediente cerrado. Entra rotado y a escala, como un tampón que cae sobre el papel."
        >
          <Stamp tone="danger">Anulada</Stamp>
          <Stamp tone="ok">Pagada</Stamp>
          <Stamp tone="default">Archivado</Stamp>
        </Sample>
      </Section>

      <Section
        id="gt-superficies"
        kicker="Gobierno de Teras"
        title="Superficies"
        lead="Ficha, panel, cajón hundido y la barra que titula un contenido. Todo lo que hay en la app es una de estas cuatro cosas, o se apoya en una."
      >
        <Sample title="Ficha, panel y cajón" code="Card · Panel · Sunken · Bar" app="gt" col>
          <Card dep="seguridad" className="w-full">
            <Bar icon="fileText" dep="seguridad" right={<Badge tone="warn">3 pendientes</Badge>}>
              Denuncias recientes
            </Bar>
            <div className="p-4 text-[0.8125rem] text-gt-ink-600">
              Una ficha con franja de departamento. El color llega como <code>--gt-dep</code> en línea.
            </div>
          </Card>

          <Panel className="w-full p-4">
            <div className="font-gt-display text-[0.9375rem] text-gt-ink-900">Panel</div>
            <p className="mt-1 text-[0.78125rem] text-gt-ink-500">Papel de fondo: agrupa sin levantar.</p>
          </Panel>

          <Sunken className="w-full p-4">
            <div className="font-gt-display text-[0.9375rem] text-gt-ink-900">Cajón hundido</div>
            <p className="mt-1 text-[0.78125rem] text-gt-ink-500">Para lo que está guardado, no para lo que actúa.</p>
          </Sunken>
        </Sample>

        <Sample title="Cabecera de página" code="PageHead" app="gt" col padded>
          <PageHead
            kicker="Hacienda"
            dep="hacienda"
            title="Tesorería municipal"
            sub="Todo lo que se ve aquí sale del libro mayor real de StarBank. Nada es autodeclarado."
            right={<Button tone="ghost" icon="download">Exportar</Button>}
          />
        </Sample>
      </Section>

      <Section
        id="gt-datos"
        kicker="Gobierno de Teras"
        title="Datos"
        lead="La estadística y el registro: las dos formas en que un gobierno mira sus propios números."
      >
        <Sample
          title="Estadísticas"
          code="Stat"
          app="gt"
          note="La cifra va grabada (Baskerville, `tabular-nums`) y la etiqueta va en mono. La franja repite el color del departamento del que sale el dato."
        >
          <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Tesorería" value="248.600" sub="₽ en caja" tone="hacienda" icon="coins" trend={1} />
            <Stat label="Denuncias" value="3" sub="sin resolver" tone="seguridad" icon="fileText" />
            <Stat label="Buscados" value="4" sub="en activo" tone="danger" icon="alert" />
            <Stat label="Parcelas" value="27" sub="registradas" tone="urbanismo" icon="mapPin" trend={-1} />
          </div>
        </Sample>

        <Sample
          title="El registro"
          code="Table · TH · TR · TD"
          app="gt"
          note="Toda lista en un gobierno es una tabla, y toda tabla es ésta: cabeceras en mono versal sobre un filete fuerte, filas con filete capilar. El alto de fila sigue a `--gt-row-py`, que `data-density` intercambia."
        >
          <Table>
            <THead>
              <TR>
                <TH>Expediente</TH>
                <TH>Ciudadano</TH>
                <TH>Motivo</TH>
                <TH className="text-right">Importe</TH>
                <TH>Estado</TH>
              </TR>
            </THead>
            <TBody>
              {[
                ["M-2210", "AzulRival", "Construcción sobre terreno ajeno", "4.500", "warn", "Pendiente"],
                ["M-2207", "KogaNinja", "Uso de TNT en zona residencial", "1.200", "ok", "Pagada"],
                ["M-2205", "JessieRocket", "Bloqueo de vía pública", "3.000", "default", "Anulada"],
              ].map(([code, user, reason, amount, tone, label]) => (
                <TR key={code}>
                  <TD className="font-gt-mono text-[0.6875rem] uppercase tracking-[.1em]">{code}</TD>
                  <TD>
                    <span className="flex items-center gap-2">
                      <Avatar user={user} size={24} />
                      <span className="font-semibold text-gt-ink-900">{user}</span>
                    </span>
                  </TD>
                  <TD>{reason}</TD>
                  <TD className="text-right font-gt-mono tabular-nums text-gt-ink-900">{amount} ₽</TD>
                  <TD>
                    <Badge tone={tone as "warn" | "ok" | "default"}>{label}</Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Sample>
      </Section>

      <Section
        id="gt-formularios"
        kicker="Gobierno de Teras"
        title="Formularios"
        lead="Campos de papel oficial: fondo claro, filete definido, y una etiqueta en mono versal encima."
      >
        <Sample title="Campos" code="Field · TextArea · Select · SearchBar" app="gt" col>
          <Field value={motivo} onChange={setMotivo} label="Motivo de la sanción" placeholder="Describe la infracción…" />
          <Select
            value={cat}
            onChange={setCat}
            label="Categoría"
            options={[
              { value: "griefing", label: "Griefing" },
              { value: "theft", label: "Robo" },
              { value: "dispute", label: "Disputa" },
              { value: "harassment", label: "Acoso" },
              { value: "other", label: "Otros" },
            ]}
          />
          <TextArea value={text} onChange={setText} label="Alegaciones" rows={3} placeholder="Expón los hechos…" />
          <Field value="" onChange={() => {}} icon="search" placeholder="Buscar ciudadano…" />
        </Sample>
      </Section>

      <Section
        id="gt-estados"
        kicker="Gobierno de Teras"
        title="Vacíos, carga y avatares"
        lead="El estado vacío no es un caso límite en este sistema: el gobierno acaba de constituirse y casi todos sus registros están en blanco. Es la primera pantalla que verá cualquiera."
      >
        <Sample title="Registro vacío" code="Empty" app="gt" col>
          <Empty
            icon="scroll"
            title="Sin denuncias registradas"
            sub="No consta ninguna denuncia en el registro municipal. Cuando un ciudadano presente la primera, aparecerá aquí."
          />
        </Sample>

        <Sample
          title="Carga"
          code="Skeleton · TableSkeleton"
          app="gt"
          col
          note="El esqueleto tiene la forma de la propia tabla, no la de una ruleta dentro de una caja."
        >
          <div className="flex w-full flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Sample>

        <Sample
          title="Avatares"
          code="Avatar"
          app="gt"
          note="La cabeza de Minecraft del ciudadano, enmarcada como la foto de un documento de identidad. Si el servicio de renders no conoce el nombre, cae a la inicial grabada."
        >
          <Avatar user="AshKetchum10" size={56} />
          <Avatar user="AgenteJenny" size={40} />
          <Avatar user="ProfesorOak" size={32} round />
          <Avatar user="" size={40} />
        </Sample>

        <Sample title="Iconos" code="Icon · 60 glifos" app="gt">
          {(
            [
              "home",
              "map",
              "mapPin",
              "landmark",
              "layers",
              "gavel",
              "scale",
              "shield",
              "alert",
              "fileText",
              "folder",
              "coins",
              "users",
              "badge",
              "megaphone",
              "star",
              "award",
              "scroll",
              "lock",
              "signal",
            ] as const
          ).map((n) => (
            <span key={n} className="flex flex-col items-center gap-1 text-gt-ink-600" title={n}>
              <Icon name={n} size={20} />
              <span className="font-gt-mono text-[0.53125rem] uppercase tracking-[.08em] text-gt-ink-400">{n}</span>
            </span>
          ))}
        </Sample>
      </Section>
    </>
  )
}
