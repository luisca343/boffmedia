"use client"

import * as React from "react"
import {
  Button,
  Checkbox,
  Chip,
  CornerBadge,
  Countdown,
  DividerLabel,
  EmptyState,
  Icon,
  Input,
  IVMeter,
  Price,
  PriceChart,
  PriceInput,
  RarityBadge,
  Range,
  Seg,
  Select,
  Skeleton,
  Stars,
  StatBar,
  Stepper,
  Tabs,
  Textarea,
  Toggle,
  TrustBadges,
  TypeBadge,
  ValueBox,
} from "@/app/smartrotom/wigglypop/_components/ui"
import { useFormat } from "@boffmedia/ui/useFormat"
import { Sample, Section } from "../showcase-shared"

// Static sample copy — the app itself resolves these via next-intl.
const ESCROW_STEPS = ["Pago retenido", "Transferencia PC", "Pago liberado"]

/** Wigglypop's primitive library — `wp-*`. Every specimen renders from real props. */
export function WpPrimitivasChapter() {
  const { number } = useFormat()
  const [toggle, setToggle] = React.useState(true)
  const [check, setCheck] = React.useState(true)
  const [tab, setTab] = React.useState("fixed")
  const [seg, setSeg] = React.useState("cozy")
  const [range, setRange] = React.useState(24000)

  // An hour and a half out, so the countdown is on the calm side of its urgency
  // switch — under an hour it turns rose and starts counting seconds.
  const endsAt = React.useMemo(() => new Date(Date.now() + 90 * 60_000).toISOString(), [])

  return (
    <>
      <Section
        id="wp-botones"
        kicker="Wigglypop"
        title="Botones"
        lead="Cuatro variantes, y el reparto importa: `primary` es el degradado rosa y va UNA sola vez por vista, sobre la acción que justifica esa vista. Dos primarios en una pantalla y no se lee ninguno. El `danger` sólo revela el rosa al pasar por encima — destructivo, nunca alarmista de antemano."
      >
        <Sample title="Variantes" code="<Button variant>" app="wp">
          <Button>Por defecto</Button>
          <Button variant="primary">
            <Icon name="cart" size={16} />
            Comprar ahora
          </Button>
          <Button variant="ghost">Fantasma</Button>
          <Button variant="danger">
            <Icon name="trash" size={15} />
            Eliminar
          </Button>
          <Button disabled>Deshabilitado</Button>
          <Button iconOnly aria-label="Buscar">
            <Icon name="search" size={16} />
          </Button>
        </Sample>
      </Section>

      <Section
        id="wp-dinero"
        kicker="Wigglypop"
        title="Dinero"
        lead="`Price` existe porque un precio NUNCA es sólo texto formateado: el glifo ₽ va en teal (el color del dinero en este sistema) mientras la cifra va en tinta, y la cifra es tabular. Lo numérico que NO es dinero (un nivel, un IV) usa `.wp-num` directamente y no pasa por aquí — el ₽ teal es lo que hace que el dinero sea dinero."
      >
        <Sample title="Precio" code="<Price amount size>" app="wp">
          <Price amount={9450} size={14} />
          <Price amount={9450} size={18} />
          <Price amount={41200} size={26} />
          <Price amount={184650} size={34} />
        </Sample>

        <Sample
          title="Tasación"
          code="<ValueBox>"
          app="wp"
          note="La ÚNICA superficie de la app que no es ni blanca ni rosa — y eso es justo lo que hace que «SmartRotom estima ₽X» se lea como una segunda opinión y no como el vendedor hablando. Es una fórmula determinista y publicada (IVs, nivel, rareza, shiny), no «IA»: llamar IA a un motor de reglas sería una mentira con la que luego carga el vendedor."
        >
          <ValueBox className="w-full max-w-md">
            <div className="mb-2 flex items-center gap-2">
              <Icon name="wand" size={16} className="text-wp-teal" />
              <span className="font-wp text-[13px] font-bold text-wp-fg">Valoración SmartRotom</span>
            </div>
            <div className="flex items-baseline gap-2.5">
              <Price amount={12350} size={22} symbolClassName="text-wp-teal-deep" />
              <span className="font-wp text-[12.5px] font-bold text-wp-green">
                −8% bajo la valoración
              </span>
            </div>
          </ValueBox>
        </Sample>

        <Sample
          title="Historial de precios"
          code="<PriceChart data>"
          app="wp"
          note="Los datos se DERIVAN de ventas reales completadas de la misma especie, no de una curva generada. Con menos de dos puntos no pinta nada: trazar una recta a través de una única venta insinuaría una tendencia inexistente (§9)."
          col
        >
          <div className="w-full max-w-md rounded-wp border-wp border-wp-line/24 bg-white p-4">
            <PriceChart data={[8200, 8600, 8400, 9100, 8900, 9600, 9450]} />
          </div>
          <div className="w-full max-w-md rounded-wp border-wp border-wp-line/24 bg-white p-4">
            <PriceChart data={[9450]} />
          </div>
        </Sample>
      </Section>

      <Section
        id="wp-rareza"
        kicker="Wigglypop"
        title="Rareza y Pokémon"
        lead="Las cuatro insignias que un comprador escanea en una parrilla de sesenta tarjetas. La palabra de rareza va sin caja, a propósito: en una parrilla una insignia enmarcada en cada tarjeta se convierte en ruido, y el color nunca va solo — la palabra siempre está escrita (§11)."
      >
        <Sample title="Rareza" code="<RarityBadge rarity>" app="wp">
          <RarityBadge rarity="comun" />
          <RarityBadge rarity="raro" />
          <RarityBadge rarity="epico" />
          <RarityBadge rarity="legendario" />
        </Sample>

        <Sample title="Insignias sobre la ilustración" code="<CornerBadge tone>" app="wp">
          <CornerBadge tone="shiny">
            <Icon name="sparkles" size={11} />
            SHINY
          </CornerBadge>
          <CornerBadge tone="legend">
            <Icon name="crown" size={11} filled />
            LEGENDARIO
          </CornerBadge>
          <CornerBadge tone="neutral">
            <Icon name="gavel" size={11} />
            Subasta
          </CornerBadge>
          <CornerBadge tone="accent">
            <Icon name="layers" size={11} />
            LOTE
          </CornerBadge>
        </Sample>

        <Sample title="Tipos" code="<TypeBadge type size>" app="wp">
          {["fire", "water", "grass", "electric", "psychic", "dragon", "fairy", "steel"].map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </Sample>

        <Sample
          title="Medidor de IVs"
          code="<IVMeter ivs>"
          app="wp"
          note="Seis celdas, una por estadística, coloreadas SÓLO cuando ese IV merece atención: llena = 31 perfecto, a media luz = 25–30, apagada = por debajo. Ese triaje es todo el valor del componente — deja detectar un 6IV en la parrilla sin leer un solo número."
        >
          <div className="flex items-center gap-3">
            <IVMeter ivs={[31, 31, 31, 31, 31, 31]} />
            <span className="wp-num font-wp text-[12px] text-wp-green">100% · 6IV</span>
          </div>
          <div className="flex items-center gap-3">
            <IVMeter ivs={[31, 28, 15, 31, 22, 6]} />
            <span className="wp-num font-wp text-[12px] text-wp-fg-muted">72%</span>
          </div>
        </Sample>

        <Sample title="Barras de estadística" code="<StatBar>" app="wp" col>
          <div className="grid w-full max-w-sm gap-2">
            {(["hp", "atk", "def", "spa", "spd", "spe"] as const).map((k, i) => (
              <StatBar key={k} statKey={k} value={[341, 200, 180, 296, 190, 260][i]} max={341} />
            ))}
          </div>
        </Sample>

        <Sample
          title="Valoración de vendedor"
          code="<Stars value>"
          app="wp"
          note="`value={null}` no pinta NADA. Un vendedor nuevo de verdad no tiene valoración, y cinco estrellas vacías insinuarían un cero que nunca se ganó (§9)."
        >
          <Stars value={4.9} />
          <Stars value={3} />
          <span className="font-wp text-[13px] font-semibold text-wp-fg-subtle">
            null → «Vendedor nuevo · sin valoraciones»
          </span>
        </Sample>

        <Sample title="Cuenta atrás de subasta" code="<Countdown endsAt>" app="wp">
          <Countdown endsAt={endsAt} />
          <span className="font-wp text-[12px] font-semibold text-wp-fg-subtle">
            bajo una hora → se vuelve rosa y cuenta segundos
          </span>
        </Sample>
      </Section>

      <Section
        id="wp-confianza"
        kicker="Wigglypop"
        title="Confianza y depósito"
        lead="Cada sello aquí afirma un hecho que el backend puede DEMOSTRAR: la propiedad se verificó contra el PC vivo del vendedor al publicar, y el dinero está de verdad retenido en una cuenta StarBank. No existe un sello de «vendedor verificado» porque nada en el dominio verifica a un vendedor, y un sello que no significa nada es peor que ningún sello."
      >
        <Sample title="Sellos de confianza" code="<TrustBadges listing>" app="wp">
          <TrustBadges listing={{ escrow: true, kind: "mon" }} />
          <TrustBadges listing={{ escrow: true, kind: "item" }} />
        </Sample>

        <Sample
          title="Seguimiento del depósito"
          code="<Stepper steps current>"
          app="wp"
          note="El paso ACTUAL va en rosa (aquí estás); un paso HECHO va en verde (esto está liquidado). El escrow se apoya en esa división: un «Pago liberado» verde significa que el dinero se movió de verdad."
          col
        >
          <Stepper steps={ESCROW_STEPS} current={0} />
          <Stepper steps={ESCROW_STEPS} current={1} />
          <Stepper steps={ESCROW_STEPS} current={2} />
        </Sample>
      </Section>

      <Section id="wp-navegacion" kicker="Wigglypop" title="Navegación">
        <Sample title="Pestañas" code="<Tabs>" app="wp">
          <Tabs
            tabs={[
              { key: "fixed", label: "Cómpralo ya", icon: "cart" },
              { key: "auction", label: "Subastas", icon: "gavel" },
              { key: "offer", label: "Ofertas", icon: "handshake" },
              { key: "trade", label: "Intercambios", icon: "swap" },
            ]}
            value={tab}
            onChange={setTab}
          />
        </Sample>

        <Sample title="Segmentado" code="<Seg>" app="wp">
          <Seg
            options={[
              { key: "cozy", icon: "grid", title: "Cuadrícula" },
              { key: "list", icon: "list", title: "Lista" },
            ]}
            value={seg}
            onChange={setSeg}
          />
          <Seg
            options={[
              { key: "mon", label: "Pokémon", icon: "grid" },
              { key: "item", label: "Objeto", icon: "package" },
            ]}
            value={seg === "cozy" ? "mon" : "item"}
            onChange={(k) => setSeg(k === "mon" ? "cozy" : "list")}
          />
        </Sample>

        <Sample title="Chips y separador" code="<Chip> · <DividerLabel>" app="wp" col>
          <div className="flex flex-wrap gap-2">
            <Chip>Nivel 100</Chip>
            <Chip>Adamant</Chip>
            <Chip className="text-wp-violet">
              <Icon name="handshake" size={12} />3 ofertas
            </Chip>
          </div>
          <DividerLabel>Anuncios similares</DividerLabel>
        </Sample>
      </Section>

      <Section
        id="wp-formularios"
        kicker="Wigglypop"
        title="Formularios"
        lead="Todos los controles comparten el mismo cromo, y lo que importa es el foco: un halo suave de 4px en `accent-soft`, no un anillo duro. Es lo que impide que el formulario parezca un panel de administración caído dentro de una tienda de caramelos."
      >
        <Sample title="Campos" code="<Input> <Select> <Textarea> <PriceInput>" app="wp" col>
          <Input placeholder="Buscar…" aria-label="Buscar" />
          <PriceInput defaultValue={9450} aria-label="Precio" />
          <Select defaultValue="relevance" aria-label="Ordenar">
            <option value="relevance">Relevancia</option>
            <option value="price-asc">Precio: menor</option>
            <option value="iv">Mejores IVs</option>
          </Select>
          <Textarea placeholder="Captura propia, OT original…" aria-label="Nota" />
        </Sample>

        <Sample title="Interruptores" code="<Toggle> <Checkbox> <Range>" app="wp" col>
          <div className="flex items-center gap-3">
            <Toggle on={toggle} onChange={setToggle} label="Solo shiny" />
            <span className="font-wp text-[13px] font-bold text-wp-fg-muted">Solo Shiny</span>
          </div>
          <Checkbox on={check} onChange={setCheck}>
            <RarityBadge rarity="epico" className="text-[12.5px]" />
          </Checkbox>
          <div className="w-full max-w-xs">
            <div className="mb-1.5 flex justify-between">
              <span className="font-wp text-[13px] font-semibold text-wp-fg-muted">Hasta</span>
              <span className="wp-num font-wp text-[13.5px] text-wp-accent">
                ₽{number(range)}
              </span>
            </div>
            <Range
              min={500}
              max={60000}
              step={500}
              value={range}
              aria-label="Precio máximo"
              onChange={(e) => setRange(Number(e.target.value))}
            />
          </div>
        </Sample>
      </Section>

      <Section id="wp-estados" kicker="Wigglypop" title="Estados">
        <Sample title="Vacío" code="<EmptyState>" app="wp" padded={false}>
          <div className="w-full">
            <EmptyState
              icon="filter"
              title="Sin resultados"
              body="Prueba a ajustar los filtros o el rango de precio."
            >
              <Button>
                <Icon name="refresh" size={14} />
                Restablecer
              </Button>
            </EmptyState>
          </div>
        </Sample>

        <Sample title="Carga" code="<Skeleton>" app="wp" col>
          <Skeleton className="h-[120px] w-full rounded-wp" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </Sample>
      </Section>
    </>
  )
}
