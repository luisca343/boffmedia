"use client"

import * as React from "react"
import { CategoryCard, ChatMessage, StreamCard, VideoCard } from "@/components/smartrotom/media/ui"
import { Sample, Section } from "../showcase-shared"
import { MW_CATEGORIES, MW_CHAT, MW_STREAMS, MW_VIDEOS } from "./mw-demo"

function VideoPair() {
  return (
    <>
      {MW_VIDEOS.map((v) => (
        <VideoCard key={v.title} v={v} />
      ))}
    </>
  )
}

function StreamPair() {
  return (
    <>
      {MW_STREAMS.map((s) => (
        <StreamCard key={s.title} s={s} />
      ))}
    </>
  )
}

function CategoryRow() {
  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
      {MW_CATEGORIES.map((g) => (
        <CategoryCard key={g.name} g={g} />
      ))}
    </div>
  )
}

function ChatPanel() {
  return (
    <div className="w-full max-w-[23.75rem] rounded-mw-xl border border-mw-line bg-mw-900 p-3">
      {MW_CHAT.map((m) => (
        <ChatMessage key={m.id} m={m} />
      ))}
    </div>
  )
}

export function MwTarjetasChapter() {
  return (
    <>
      <Section
        id="mw-video"
        kicker="Media"
        title="Vídeo"
        lead={
          <>
            <code>VideoCard</code> recibe un único objeto <code>v</code> (<code>VideoCardData</code>): miniatura 16:9,
            duración, autor con verificación, visitas y antigüedad. Si llega <code>progress</code> (0–1) dibuja la
            barra de «seguir viendo». La tarjeta entera es un <code>Link</code>.
          </>
        }
      >
        <Sample
          app="mw"
          media="mewtube"
          title="VideoCard · Mewtube"
          code="<VideoCard v={…} />"
          grid
          note="La segunda tarjeta lleva progress=0.62: la barra de continuación se pinta con el acento."
        >
          <VideoPair />
        </Sample>

        <Sample
          app="mw"
          media="mewtwitch"
          title="La misma tarjeta · Mewtwitch"
          code='data-app="mewtwitch"'
          grid
          note={
            <>
              Mismos datos, mismo componente, cero props de plataforma: el borde, el botón de reproducción, el halo al
              pasar por encima y la barra de progreso se derivan de <code>--mw-accent</code>. Esta es toda la
              «diferencia» entre las dos apps.
            </>
          }
        >
          <VideoPair />
        </Sample>
      </Section>

      <Section
        id="mw-stream"
        kicker="Media"
        title="Directo y categoría"
        lead={
          <>
            <code>StreamCard</code> es la tarjeta de un canal emitiendo: previsualización, <code>LivePill</code> fija
            arriba a la izquierda, contador con <code>PulseDot</code>, avatar con anillo, juego y etiquetas.{" "}
            <code>CategoryCard</code> es el arte 3:4 de una categoría con espectadores y número de canales.
          </>
        }
      >
        <Sample app="mw" media="mewtwitch" title="StreamCard · Mewtwitch" code="<StreamCard s={…} />" grid>
          <StreamPair />
        </Sample>

        <Sample
          app="mw"
          media="mewtube"
          title="La misma tarjeta · Mewtube"
          code='data-app="mewtube"'
          grid
          note="Los espectadores se formatean con el locale del visitante (agrupación es-ES o en-US según corresponda)."
        >
          <StreamPair />
        </Sample>

        <Sample app="mw" media="mewtwitch" title="CategoryCard · Mewtwitch" code="<CategoryCard g={…} />">
          <CategoryRow />
        </Sample>

        <Sample
          app="mw"
          media="mewtube"
          title="CategoryCard · Mewtube"
          code='data-app="mewtube"'
          note={
            <>
              <code>viewers</code> y <code>streams</code> son opcionales: cuando la API no los da, la tarjeta se queda
              solo con el arte en lugar de inventar un cero.
            </>
          }
        >
          <CategoryRow />
        </Sample>
      </Section>

      <Section
        id="mw-chat"
        kicker="Media"
        title="Chat"
        lead={
          <>
            <code>ChatMessage</code> pinta una línea: insignia MOD, verificación, mensaje de sistema (en el tono{" "}
            <code>highlight</code>, nunca en el acento) y resalte cuando el mensaje es tuyo. El color del nick llega
            como dato del propio IRC, así que va en <code>style</code>, no en una clase.
          </>
        }
      >
        <Sample
          app="mw"
          media="mewtwitch"
          title="ChatMessage · Mewtwitch"
          code="mod · verified · system · you"
          note={
            <>
              Leer el chat funciona de forma nativa: se abre un WebSocket anónimo contra el IRC de Twitch (login{" "}
              <code>justinfan</code>), sin token ni cuenta. <strong>Enviar</strong> está{" "}
              <code>[deferred]</code> y bloqueado tras autenticación: exige un token OAuth de Twitch con permiso{" "}
              <code>chat:edit</code> del usuario, que hoy no pedimos.
            </>
          }
        >
          <ChatPanel />
        </Sample>

        <Sample
          app="mw"
          media="mewtube"
          title="El mismo chat · Mewtube"
          code='data-app="mewtube"'
          note="El resalte de «tu» mensaje y la insignia de verificado siguen al acento; el mensaje de sistema no, porque su significado es «evento», no «marca»."
        >
          <ChatPanel />
        </Sample>
      </Section>
    </>
  )
}
