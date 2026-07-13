"use client"

import * as React from "react"
import { Button, Icon } from "../../../taxi/_components/ui"
import { OffscreenPin, PlayerMarker, StopPin } from "../../../taxi/_components/map/StopPin"
import { Compass, RecenterButton, ScaleChip, ZoomControls } from "../../../taxi/_components/map/MapControls"
import { StopRow } from "../../../taxi/_components/StopRow"
import { SelectedCard } from "../../../taxi/_components/SelectedCard"
import { ConfirmModal, InsufficientModal } from "../../../taxi/_components/flows/ConfirmModal"
import { TravelingOverlay } from "../../../taxi/_components/flows/TravelingOverlay"
import { WalletModal } from "../../../taxi/_components/flows/WalletModal"
import { EventCard, EventHero } from "../../../taxi/_components/deferred/EventsPanel"
import { HappyHourBanner, LivePill, OnlinePill } from "../../../taxi/_components/deferred/Presence"
import { AchievementRow, GroupTeleport, RiderCard, TopUpGrid } from "../../../taxi/_components/deferred/Rewards"
import { Sample, Section } from "../showcase-shared"
import {
  TX_ACHIEVEMENTS,
  TX_EVENTS,
  TX_PACKAGES,
  TX_PARTY,
  TX_STOPS,
  TX_TIERS,
  TX_TRANSACTIONS,
} from "./tx-demo"

const noop = () => {}

/** The map's pieces sit absolutely, so they need a field to sit on. */
function Field({ children, className = "h-[220px]" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-tx-md border border-solid border-tx-line bg-tx-field ${className}`}
    >
      {children}
    </div>
  )
}

function StopRowDemo() {
  const [selected, setSelected] = React.useState("Puerto Wingull")
  const [favorites, setFavorites] = React.useState<string[]>(["Liga Teras"])
  return (
    <div className="flex w-full flex-col gap-[9px]">
      {TX_STOPS.map((stop) => (
        <StopRow
          key={stop.id}
          stop={stop}
          selected={selected === stop.id}
          affordable={stop.price < 2000}
          favorite={favorites.includes(stop.id)}
          onSelect={(s) => setSelected(s.id)}
          onToggleFavorite={(id) =>
            setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))
          }
        />
      ))}
    </div>
  )
}

function FlowsDemo() {
  const [open, setOpen] = React.useState<null | "confirm" | "insufficient" | "traveling" | "wallet">(null)

  React.useEffect(() => {
    if (open !== "traveling") return
    const id = setTimeout(() => setOpen(null), 2600)
    return () => clearTimeout(id)
  }, [open])

  return (
    <>
      <Button variant="quiet" onClick={() => setOpen("confirm")}>
        Confirmar viaje
      </Button>
      <Button variant="quiet" onClick={() => setOpen("insufficient")}>
        Saldo insuficiente
      </Button>
      <Button variant="quiet" onClick={() => setOpen("traveling")}>
        Teletransportando
      </Button>
      <Button variant="quiet" onClick={() => setOpen("wallet")}>
        Cartera
      </Button>

      {open === "confirm" && (
        <ConfirmModal
          stop={TX_STOPS[1]}
          player={{ x: 128, z: -296 }}
          balance={9240}
          pending={false}
          onConfirm={() => setOpen(null)}
          onCancel={() => setOpen(null)}
        />
      )}
      {open === "insufficient" && (
        <InsufficientModal
          stop={TX_STOPS[2]}
          price={TX_STOPS[2].price}
          balance={1200}
          onClose={() => setOpen(null)}
          onTopUp={() => setOpen("wallet")}
        />
      )}
      {open === "traveling" && <TravelingOverlay stopId="Puerto Wingull" reduceMotion={false} />}
      {open === "wallet" && (
        <WalletModal
          balance={9240}
          loading={false}
          playerName="EntrenadorAsh"
          onClose={() => setOpen(null)}
          transactions={TX_TRANSACTIONS}
          accountIds={[1]}
        />
      )}
    </>
  )
}

export function TxViajeChapter() {
  return (
    <>
      <Section
        id="tx-mapa"
        kicker="Viaje"
        title="El mapa"
        lead={
          <>
            El mapa es el producto. La cámara vive en un <i>ref</i>, no en el estado: un arrastre dispara un
            evento por píxel y pasarlo por <code>setState</code> haría que el mapa fuese detrás del cursor.
          </>
        }
      >
        <Sample
          title="Chinchetas"
          code="<StopPin selected>"
          app="tx"
          padded={false}
          note="Seleccionada, la chincheta se pone ámbar — el mismo ámbar que cobrará. Sin seleccionar es azul: es estructura."
        >
          <Field>
            <StopPin stop={TX_STOPS[0]} x={130} y={70} selected={false} onSelect={noop} />
            <StopPin stop={TX_STOPS[1]} x={330} y={150} selected onSelect={noop} />
          </Field>
        </Sample>

        <Sample
          title="Jugador y fuera de pantalla"
          code="<PlayerMarker> · <OffscreenPin>"
          app="tx"
          padded={false}
          note="Una parada que se sale del encuadre no desaparece: se ancla al borde apuntando a dónde se fue, para que siempre se pueda volver a ella."
        >
          <Field>
            <PlayerMarker x={200} y={110} reduceMotion={false} />
            <OffscreenPin stop={TX_STOPS[2]} x={40} y={60} angle={Math.PI} selected={false} onSelect={noop} />
            <OffscreenPin stop={TX_STOPS[1]} x={40} y={160} angle={(3 * Math.PI) / 4} selected onSelect={noop} />
          </Field>
        </Sample>

        <Sample title="Controles" code="<Compass> · <ZoomControls> · <ScaleChip>" app="tx" padded={false}>
          <Field className="h-[260px]">
            <Compass />
            <ZoomControls onZoom={noop} />
            <ScaleChip scale={0.09} bottom={16} />
            <RecenterButton onClick={noop} bottom={18} />
          </Field>
        </Sample>
      </Section>

      <Section
        id="tx-destinos"
        kicker="Viaje"
        title="Destinos"
        lead={
          <>
            La lista está ordenada por distancia porque es el eje sobre el que se tarifa: lo más cerca es también
            lo más barato.
          </>
        }
      >
        <Sample title="Fila de destino" code="<StopRow>" app="tx" padded={false}>
          <div className="w-full p-[26px]">
            <StopRowDemo />
          </div>
        </Sample>

        <Sample
          title="Tarjeta de destino"
          code="<SelectedCard>"
          app="tx"
          padded={false}
          note={
            <>
              La única superficie de la app que gasta dinero, y por eso la única con botón ámbar. Siempre dice el
              saldo que quedará <i>antes</i> de comprometerse.
            </>
          }
        >
          <div className="w-full p-[26px]">
            <div className="max-w-[380px]">
              <SelectedCard
                stop={TX_STOPS[1]}
                balance={9240}
                favorite
                onToggleFavorite={noop}
                onTravel={noop}
                onTopUp={noop}
                onClose={noop}
                onRecenter={noop}
              />
            </div>
          </div>
        </Sample>

        <Sample
          title="Sin saldo"
          code="<SelectedCard> · afford=false"
          app="tx"
          padded={false}
          note="Cuando la tarifa supera el saldo, la acción principal pasa a ser «recargar», no un «viajar» deshabilitado: un botón muerto dice que estás atascado, éste dice por dónde salir."
        >
          <div className="w-full p-[26px]">
            <div className="max-w-[380px]">
              <SelectedCard
                stop={TX_STOPS[2]}
                balance={1200}
                favorite={false}
                onToggleFavorite={noop}
                onTravel={noop}
                onTopUp={noop}
                onClose={noop}
                onRecenter={noop}
              />
            </div>
          </div>
        </Sample>
      </Section>

      <Section
        id="tx-pago"
        kicker="Viaje"
        title="Pago y llegada"
        lead={
          <>
            El cobro va antes que el teletransporte y no es reversible, así que la confirmación desglosa la
            tarifa exactamente como la cobra el servidor: base + distancia.
          </>
        }
      >
        <Sample title="Flujos" code="<ConfirmModal> · <TravelingOverlay> · <WalletModal>" app="tx">
          <FlowsDemo />
        </Sample>
      </Section>

      <Section
        id="tx-diferido"
        kicker="Diferido"
        title="Construido, sin datos que lo alimenten"
        lead={
          <>
            Todo lo de aquí abajo está construido tal cual lo pedía el handoff, pero <b>no se renderiza en la
            app</b>: no hay API que lo alimente. Enseñarlo con incursiones, descuentos y jugadores inventados
            sería exactamente la fabricación que prohíbe <code>SMARTROTOM_V3</code> §9. Catalogado en{" "}
            <code>docs/smartrotom/deferred/</code>; el día que exista el endpoint, estos componentes entran tal
            cual.
          </>
        }
      >
        <Sample
          title="Presencia en vivo"
          code="<LivePill> · <OnlinePill>"
          app="tx"
          note="Wingull no expone posiciones de jugadores ni un recuento de conectados — no hay nada que contar."
        >
          <OnlinePill count={312} />
          <LivePill count={84} />
          <LivePill count={12} />
          <LivePill count={2} />
        </Sample>

        <Sample
          title="Hora feliz"
          code="<HappyHourBanner>"
          app="tx"
          col
          note="No hay backend de promociones ni campo de descuento en la tarifa. Aplicarlo en cliente significaría que el cliente decide lo que cobra — cosa que el camino de pago nunca puede hacer."
        >
          <HappyHourBanner discount={0.25} endsInMin={35} />
        </Sample>

        <Sample
          title="Eventos"
          code="<EventHero> · <EventCard>"
          app="tx"
          col
          note="La pestaña entera («Eventos») está fuera de la app: no existe tabla ni endpoint de eventos. Una cuenta atrás hacia un evento que no es real es peor que no tener tablón."
        >
          <EventHero event={TX_EVENTS[0]} />
          <EventCard event={TX_EVENTS[1]} />
          <EventCard event={TX_EVENTS[2]} />
        </Sample>

        <Sample
          title="Viaje en grupo"
          code="<GroupTeleport>"
          app="tx"
          col
          note="Faltan dos cosas: un endpoint de party (quién va con quién) y un teletransporte multi-pasajero en el servidor."
        >
          <GroupTeleport party={TX_PARTY} fare={1482} />
        </Sample>

        <Sample
          title="Pasajero frecuente"
          code="<RiderCard> · <AchievementRow>"
          app="tx"
          col
          note={
            <>
              Los viajes sí son reales (salen del libro mayor), pero un nivel que otorga un descuento real es una
              regla de precio, y el precio vive en el servidor. Enseñar un «−10%» que el cobro no va a respetar es
              una mentira que paga el jugador.
            </>
          }
        >
          <RiderCard tier={TX_TIERS[2]} next={TX_TIERS[3]} trips={27} streakDays={6} freeRideEvery={10} />
          {TX_ACHIEVEMENTS.map((a) => (
            <AchievementRow key={a.id} achievement={a} />
          ))}
        </Sample>

        <Sample
          title="Packs de monedas"
          code="<TopUpGrid>"
          app="tx"
          col
          note="La única fabricación con coste real: no hay endpoint de packs, ni pasarela, ni precios. La cartera va sin tienda y enseña la verdad — lo que tienes y a dónde se fue."
        >
          <TopUpGrid packages={TX_PACKAGES} />
        </Sample>
      </Section>
    </>
  )
}
