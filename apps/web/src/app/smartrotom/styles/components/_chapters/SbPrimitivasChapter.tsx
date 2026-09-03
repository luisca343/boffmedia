"use client"

import * as React from "react"
import { Sample, Section } from "../showcase-shared"
import {
  AccountAvatar,
  Avatar,
  Button,
  Card,
  CardBody,
  CategoryChip,
  Chip,
  ContactAvatar,
  EntityAvatar,
  Ico,
  Input,
  Label,
  PageHeader,
  SectionHead,
  Select,
} from "@/app/smartrotom/starbank/_components/ui"
import { CATEGORIES } from "@/app/smartrotom/starbank/_utils/categories"
import { SB_ACCOUNTS } from "./sb-demo"

const CATEGORY_LIST = [
  CATEGORIES.league,
  CATEGORIES.shop,
  CATEGORIES.heal,
  CATEGORIES.transfer,
  CATEGORIES.reward,
  CATEGORIES.fee,
  CATEGORIES.subscription,
  CATEGORIES.other,
]

export function SbPrimitivasChapter() {
  return (
    <>
      <Section
        id="sb-botones"
        kicker="Starbank"
        title="Botones y chips"
        lead={
          <>
            Seis variantes, cuatro tamaños. <code>primary</code> es la única que proyecta la sombra de marca —
            una acción principal por pantalla. <code>glass</code> y <code>solid</code> sólo existen sobre el
            azul del héroe.
          </>
        }
      >
        <Sample app="sb" title="Variantes" code="<Button variant>">
          <Button variant="primary">Enviar dinero</Button>
          <Button variant="secondary">Descargar extracto</Button>
          <Button variant="ghost">Ver todo</Button>
          <Button variant="danger">Cancelar envío</Button>
          <Button variant="secondary" disabled>
            Deshabilitado
          </Button>
        </Sample>

        <Sample
          app="sb"
          title="Sobre el héroe"
          code="glass · solid"
          padded={false}
          note={
            <>
              Estas dos variantes asumen fondo azul saturado: <code>glass</code> es cristal sobre el degradado
              y <code>solid</code> el blanco que devuelve el contraste. Fuera del héroe se vuelven ilegibles.
            </>
          }
        >
          <div className="flex w-full flex-wrap items-center gap-3 bg-sb-700 p-[1.625rem]">
            <Button variant="glass">
              <Ico name="qrcode" size={16} /> Escanear QR
            </Button>
            <Button variant="glass">
              <Ico name="eye" size={16} /> Ocultar saldo
            </Button>
            <Button variant="solid">
              <Ico name="send" size={16} /> Nueva transferencia
            </Button>
          </div>
        </Sample>

        <Sample app="sb" title="Tamaños e icono" code="sm · md · lg · icon">
          <Button variant="primary" size="sm">
            Pequeño
          </Button>
          <Button variant="primary" size="md">
            Medio
          </Button>
          <Button variant="primary" size="lg">
            Grande
          </Button>
          <Button variant="secondary" size="icon" aria-label="Más opciones">
            <Ico name="more" size={16} />
          </Button>
          <Button variant="primary" size="md">
            <Ico name="plus" size={16} /> Con icono
          </Button>
        </Sample>

        <Sample
          app="sb"
          title="Chips de estado"
          code="<Chip tone dot lg>"
          note={
            <>
              El tono <code>default</code> es informativo; los cuatro semánticos cuantifican el estado del
              dinero. <code>dot</code> añade el punto y <code>lg</code> el tamaño de cabecera.
            </>
          }
        >
          <Chip>Neutro</Chip>
          <Chip tone="brand">Marca</Chip>
          <Chip tone="pos" dot>
            Completada
          </Chip>
          <Chip tone="neg" dot>
            Rechazada
          </Chip>
          <Chip tone="warn" dot>
            Pendiente
          </Chip>
          <Chip tone="info" dot>
            Programada
          </Chip>
          <Chip tone="brand" lg>
            Grande
          </Chip>
        </Sample>

        <Sample
          app="sb"
          title="Chips de categoría"
          code="<CategoryChip category>"
          note={
            <>
              Se alimenta de <code>CATEGORIES</code>, así que el punto, el texto y el tinte al 10% salen
              siempre de la misma fuente: leyenda, tabla y detalle no pueden desincronizarse.
            </>
          }
        >
          {CATEGORY_LIST.map((c) => (
            <CategoryChip key={c.id} category={c} />
          ))}
        </Sample>
      </Section>

      <Section
        id="sb-formularios"
        kicker="Starbank"
        title="Formularios"
        lead={
          <>
            Un único control de 40px de alto: <code>Input</code> y <code>Select</code> comparten caja, borde y
            foco. La etiqueta va siempre encima, en versalitas, nunca dentro del campo.
          </>
        }
      >
        <Sample app="sb" title="Campos" code="<Label> · <Input> · <Select>" col>
          <div className="grid w-full gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sb-demo-dest">Destinatario</Label>
              <Input id="sb-demo-dest" placeholder="Nombre o nº de cuenta" defaultValue="Teras" />
            </div>
            <div>
              <Label htmlFor="sb-demo-amount">Importe</Label>
              <Input id="sb-demo-amount" inputMode="numeric" defaultValue="3.200" className="tabular-nums" />
            </div>
            <div>
              <Label htmlFor="sb-demo-cat">Categoría</Label>
              <Select id="sb-demo-cat" defaultValue="shop">
                {CATEGORY_LIST.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="sb-demo-locked">Cuenta origen (bloqueada)</Label>
              <Input id="sb-demo-locked" defaultValue="Rotom_Dex · 128.400 ¥" disabled className="tabular-nums" />
            </div>
          </div>
        </Sample>

        <Sample
          app="sb"
          title="Foco"
          code="shadow-sb-focus"
          note={
            <>
              Al enfocar, el borde sube a <code>sb-400</code> y aparece el halo de 3px{" "}
              <code>shadow-sb-focus</code>. Es el único anillo del sistema: no se sustituye por{" "}
              <code>outline</code>.
            </>
          }
        >
          <div className="w-full max-w-[20rem]">
            <Label htmlFor="sb-demo-focus">Pulsa aquí</Label>
            <Input id="sb-demo-focus" placeholder="Concepto del envío" />
          </div>
        </Sample>
      </Section>

      <Section
        id="sb-avatares"
        kicker="Starbank"
        title="Avatares"
        lead={
          <>
            <code>Avatar</code> es la pieza tonta (imagen o monograma). <code>EntityAvatar</code> resuelve la
            URL real y degrada sola: una cuenta secundaria sin imagen cae al monograma con color derivado del
            id; una principal, a la cabeza de repuesto.
          </>
        }
      >
        <Sample app="sb" title="Avatar" code="<Avatar initials color size square>">
          <Avatar initials="RD" size={28} />
          <Avatar initials="TE" color="#8b5cf6" size={36} />
          <Avatar initials="LP" color="#10b981" size={44} />
          <Avatar initials="GC" color="#f59e0b" size={56} />
          <Avatar initials="AB" color="#06b6d4" size={56} square />
        </Sample>

        <Sample
          app="sb"
          title="Cuenta y contacto"
          code="<AccountAvatar> · <ContactAvatar>"
          note={
            <>
              La tercera pieza es la degradación en directo: <code>ContactAvatar</code> de una cuenta
              secundaria sin imagen intenta su ruta, falla y cae al monograma. Es el comportamiento real, no
              un mock.
            </>
          }
        >
          <div className="flex flex-wrap items-center gap-6">
            {SB_ACCOUNTS.map((account) => (
              <div key={account.id} className="flex items-center gap-2.5">
                <AccountAvatar account={account} size={44} />
                <div className="text-[0.75rem] leading-tight">
                  <div className="font-semibold text-sb-fg">{account.name}</div>
                  <div className="text-sb-fg-muted">{account.type === "MAIN" ? "Principal" : "Secundaria"}</div>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2.5">
              <ContactAvatar name="Gimnasio_Celeste" type="SECONDARY" id={7} size={44} />
              <div className="text-[0.75rem] leading-tight">
                <div className="font-semibold text-sb-fg">Gimnasio Celeste</div>
                <div className="text-sb-fg-muted">Sin imagen → monograma</div>
              </div>
            </div>
            <EntityAvatar type="SECONDARY" name="Teras" id={2} size={44} square />
          </div>
        </Sample>
      </Section>

      <Section
        id="sb-tarjetas"
        kicker="Starbank"
        title="Tarjetas y cabeceras"
        lead={
          <>
            Todo el contenido vive en tarjetas de <code>18px</code> de radio. <code>SectionHead</code> pone la
            cabecera con su acción a la derecha y <code>CardBody</code> el cuerpo con el ritmo vertical;{" "}
            <code>noPad</code> lo desactiva cuando dentro va una lista a sangre.
          </>
        }
      >
        <Sample app="sb" title="Composición" code="<Card><SectionHead/><CardBody/></Card>" col>
          <div className="grid w-full gap-4 sm:grid-cols-2">
            <Card>
              <SectionHead
                title="Movimientos"
                eyebrow="Últimos 30 días"
                action={
                  <Button variant="ghost" size="sm">
                    Ver todo <Ico name="arrR" size={14} />
                  </Button>
                }
              />
              <CardBody>
                <p className="m-0 text-[0.84375rem] text-sb-fg-2">
                  Cuerpo con el ritmo por defecto: <code className="font-mono text-[0.75rem]">gap-3.5</code> y
                  padding lateral de 20px.
                </p>
                <div className="flex items-center gap-2">
                  <Chip tone="pos" dot>
                    12 ingresos
                  </Chip>
                  <Chip tone="neg" dot>
                    31 gastos
                  </Chip>
                </div>
              </CardBody>
            </Card>

            <Card flat>
              <SectionHead title="Tarjeta plana" eyebrow="flat" />
              <CardBody>
                <p className="m-0 text-[0.84375rem] text-sb-fg-2">
                  <code className="font-mono text-[0.75rem]">flat</code> quita la sombra: para tarjetas anidadas
                  dentro de otra superficie, donde una segunda sombra ensuciaría.
                </p>
                <div className="rounded-sb-md border border-sb-border bg-sb-surface-2 p-3 text-[0.78125rem] text-sb-fg-muted">
                  Bloque interior sobre <code className="font-mono text-[0.71875rem]">sb-surface-2</code>.
                </div>
              </CardBody>
            </Card>
          </div>
        </Sample>

        <Sample
          app="sb"
          theme="dark"
          title="La misma tarjeta, en oscuro"
          code='data-theme="dark"'
          col
          note={
            <>
              Ni una clase cambia. La tarjeta, la sombra y los chips leen variables, así que el tema los
              repinta solos — incluida la elevación, que en oscuro es una sombra negra y no la veladura azul
              del modo claro.
            </>
          }
        >
          <div className="grid w-full gap-4 sm:grid-cols-2">
            <Card>
              <SectionHead
                title="Movimientos"
                eyebrow="Últimos 30 días"
                action={
                  <Button variant="ghost" size="sm">
                    Ver todo <Ico name="arrR" size={14} />
                  </Button>
                }
              />
              <CardBody>
                <p className="m-0 text-[0.84375rem] text-sb-fg-2">Superficie sobre lienzo, con la misma jerarquía.</p>
                <div className="flex items-center gap-2">
                  <Chip tone="pos" dot>
                    12 ingresos
                  </Chip>
                  <Chip tone="neg" dot>
                    31 gastos
                  </Chip>
                </div>
              </CardBody>
            </Card>

            <Card flat>
              <SectionHead title="Tarjeta plana" eyebrow="flat" />
              <CardBody>
                <div className="rounded-sb-md border border-sb-border bg-sb-surface-2 p-3 text-[0.78125rem] text-sb-fg-muted">
                  Bloque interior sobre <code className="font-mono text-[0.71875rem]">sb-surface-2</code>.
                </div>
              </CardBody>
            </Card>
          </div>
        </Sample>

        <Sample
          app="sb"
          title="Cabecera de página"
          code="<PageHeader title sub actions>"
          col
          note={
            <>
              Un solo <code>PageHeader</code> por ruta, siempre lo primero del contenido. Las acciones se
              alinean con la línea base del título.
            </>
          }
        >
          <PageHeader
            title="Transferencias"
            sub="Envía dinero a cualquier cuenta de la región"
            actions={
              <>
                <Button variant="secondary" size="sm">
                  <Ico name="download" size={15} /> Exportar
                </Button>
                <Button variant="primary" size="sm">
                  <Ico name="send" size={15} /> Nueva
                </Button>
              </>
            }
          />
        </Sample>
      </Section>
    </>
  )
}
