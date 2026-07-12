"use client"

import * as React from "react"
import { Sample, Section } from "../showcase-shared"
import { Composer } from "../../../chatapp/_components/Composer"
import { ContactRow } from "../../../chatapp/_components/ContactRow"
import { MessageRow } from "../../../chatapp/_components/messages/MessageRow"
import { Button } from "../../../chatapp/_components/ui"
import { CHAT_TYPE, type ChatMessageVM, type ChatVM } from "../../../chatapp/_types/view"

const ME = "069a79f4-44e9-4726-a5be-fca90e38aaf5"
const MARTA = "853c80ef-3c37-49fd-aa49-938b674adae6"
const IKER = "61699b2e-d327-4a01-9f1e-0ea8c3f06bc6"
const mcHead = (uuid: string) => `https://mc-heads.net/avatar/${uuid}`

// Timestamps without a timezone designator are parsed as LOCAL time, so `timeOf()` renders
// the same string on the server and on the client — an absolute instant would not, and the
// showcase would hydrate with a mismatch.
const at = (hhmm: string) => `2026-07-12T${hhmm}:00`

const noop = () => {}

// The Composer only touches `session` when there is a reply to label, and it does so through
// `getSmartRotomUser(session)` — so a real session shape is needed for that one specimen.
const DEMO_SESSION = { user: { smartRotomUser: { uuid: ME } } }

function msg(m: Omit<ChatMessageVM, "chatId">): ChatMessageVM {
  return { chatId: 1, ...m }
}

const TEXTS: ChatMessageVM[] = [
  msg({ id: 1, uuid: MARTA, type: "text", content: "¿Seguimos con la base del lago esta noche?", createdAt: at("21:02") }),
  msg({ id: 2, uuid: MARTA, type: "text", content: "Tengo material de sobra para el techo", createdAt: at("21:02") }),
  msg({ id: 3, uuid: ME, type: "text", content: "Sí, entro en 10 minutos", createdAt: at("21:04"), status: "read" }),
  msg({ id: 4, uuid: ME, type: "text", content: "Llevo la madera oscura", createdAt: at("21:04"), status: "read" }),
  msg({ id: 5, uuid: IKER, type: "text", content: "Yo me traigo la pólvora que sobró de la raid", createdAt: at("21:06") }),
]

const RECEIPTS: ChatMessageVM[] = [
  msg({ id: 11, uuid: ME, type: "text", content: "Enviado — un tick gris", createdAt: at("21:10"), status: "sent" }),
  msg({ id: 12, uuid: ME, type: "text", content: "Entregado — doble tick gris", createdAt: at("21:10"), status: "delivered" }),
  msg({ id: 13, uuid: ME, type: "text", content: "Leído — doble tick azul", createdAt: at("21:11"), status: "read" }),
]

const REPLIES: ChatMessageVM[] = [
  msg({ id: 21, uuid: MARTA, type: "text", content: "He dejado 3 stacks de vidrio en el cofre de arriba", createdAt: at("18:30") }),
  msg({
    id: 22,
    uuid: ME,
    type: "text",
    content: "Perfecto, me faltaba justo eso",
    createdAt: at("18:32"),
    status: "read",
    replyTo: 21,
    reactions: [{ emoji: "🔥", by: [MARTA] }],
  }),
  msg({
    id: 23,
    uuid: MARTA,
    type: "text",
    content: "Y he puesto un waypoint en la entrada",
    createdAt: at("18:33"),
    reactions: [
      { emoji: "👍", by: [ME, IKER] },
      { emoji: "🎉", by: [IKER] },
    ],
  }),
]

const WAYPOINT = JSON.stringify({
  name: "Base del lago",
  x: -118,
  y: 71,
  z: 402,
  dimension: "Overworld",
  color: "#00a884",
})

const DOCUMENT = JSON.stringify({
  documentId: 12,
  title: "Ruta de farmeo — semana 3",
  content: "Mina profunda → aldea → templo del desierto. Volver antes del amanecer.",
})

const VIDEO = JSON.stringify({
  videoId: "dQw4w9WgXcQ",
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  title: "Cómo montar una granja de hierro",
})

const IMAGE = JSON.stringify({
  imageUrl: "/smartrotom/img/apps/chatapp.webp",
  meta: {
    id: "cap-01",
    timestamp: 0,
    caption: "Mirad lo que ha salido del lago",
    location: {
      playerPosition: { x: -118.4, y: 71, z: 402.2 },
      lookingAt: { x: -120, y: 70, z: 405, block: "minecraft:oak_log" },
    },
    entities: [
      { type: "pokemon", species: "Lapras", dex: 131, form: "Shiny", palette: "", distance: 12, coverage: 38, position: { x: 0, y: 0, z: 0 } },
      { type: "npc", name: "Aldeano herrero", distance: 6, coverage: 11, position: { x: 0, y: 0, z: 0 } },
    ],
  },
})

const CARDS: ChatMessageVM[] = [
  msg({ id: 31, uuid: MARTA, type: "image", content: IMAGE, createdAt: at("12:01") }),
  msg({ id: 32, uuid: ME, type: "waypoint", content: WAYPOINT, createdAt: at("12:04"), status: "read" }),
  msg({ id: 33, uuid: MARTA, type: "document", content: DOCUMENT, createdAt: at("12:09") }),
  msg({ id: 34, uuid: MARTA, type: "video", content: VIDEO, createdAt: at("12:12") }),
  msg({ id: 35, uuid: ME, type: "sticker", content: "/smartrotom/img/apps/chatapp/stickers/pikachu_chill.webp", createdAt: at("12:14"), status: "delivered" }),
  msg({ id: 36, uuid: ME, type: "emoji", content: "🎉", createdAt: at("12:15"), status: "sent" }),
]

const EVENTS: ChatMessageVM[] = [
  msg({ id: 41, uuid: "system", type: "system", content: "Has creado el grupo «Equipo Wingull»", createdAt: at("09:00") }),
  msg({ id: 42, uuid: MARTA, type: "call", content: "184", createdAt: at("09:12") }),
  msg({ id: 43, uuid: ME, type: "call", content: "0", createdAt: at("09:30") }),
  msg({ id: 44, uuid: "system", type: "system", content: "Iker se unió al grupo", createdAt: at("09:31") }),
]

const CHAT: ChatVM = {
  id: 1,
  name: "Equipo Wingull",
  type: CHAT_TYPE.GROUP,
  image: mcHead(MARTA),
  messages: [...TEXTS, ...RECEIPTS, ...REPLIES, ...CARDS, ...EVENTS],
  unread: 0,
  members: [
    { uuid: ME, username: "Luisca" },
    { uuid: MARTA, username: "Marta" },
    { uuid: IKER, username: "Iker" },
  ],
}

const REPLY_TARGET = REPLIES[0]

function ThemePair({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid w-full grid-cols-1 xl:grid-cols-2">
      {(["light", "dark"] as const).map((t) => (
        <div key={t} className="ca-app bg-ca-panel p-[22px] font-ca text-ca-50 antialiased" data-theme={t}>
          <div className="mb-4 font-ca-mono text-[10px] uppercase tracking-[0.16em] text-ca-400">
            {t === "light" ? "Claro" : "Oscuro"}
          </div>
          {children}
        </div>
      ))}
    </div>
  )
}

/** The conversation surface: flat colour + the masked doodle, exactly as `Conversation.tsx`. */
function Wall({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full overflow-hidden rounded-[12px] bg-ca-wallpaper p-4">
      <div className="ca-doodle pointer-events-none absolute inset-0" />
      <div className="relative flex flex-col">{children}</div>
    </div>
  )
}

/** `MessageRow` reads its neighbours to decide grouping (tail, avatar, spacing), so a demo
 *  has to feed it the real prev/next — a lone row always renders as a first-of-run bubble. */
function Thread({ items, isGroup = true }: { items: ChatMessageVM[]; isGroup?: boolean }) {
  return (
    <Wall>
      {items.map((m, i) => (
        <MessageRow
          key={m.id}
          message={m}
          prev={items[i - 1]}
          next={items[i + 1]}
          chat={CHAT}
          isGroup={isGroup}
          myUuid={ME}
          onReact={noop}
          onReply={noop}
          onOpenImage={noop}
          onCallback={noop}
        />
      ))}
    </Wall>
  )
}

function contact(over: Partial<ChatVM> & { id: number; name: string; type: number; messages: ChatMessageVM[] }): ChatVM {
  return { image: mcHead(MARTA), unread: 0, members: CHAT.members, ...over }
}

const CONTACTS: { chat: ChatVM; active?: boolean; typing?: boolean }[] = [
  {
    chat: contact({
      id: 2,
      name: "Marta",
      type: CHAT_TYPE.DIRECT,
      presence: "online",
      messages: [msg({ id: 101, uuid: MARTA, type: "text", content: "Voy para el lago", createdAt: at("21:31") })],
    }),
    active: true,
  },
  {
    chat: contact({
      id: 3,
      name: "Equipo Wingull",
      type: CHAT_TYPE.GROUP,
      image: mcHead(IKER),
      unread: 4,
      messages: [msg({ id: 102, uuid: IKER, type: "image", content: IMAGE, createdAt: at("20:58") })],
    }),
  },
  {
    chat: contact({
      id: 4,
      name: "Iker",
      type: CHAT_TYPE.DIRECT,
      image: mcHead(IKER),
      presence: "ingame",
      messages: [msg({ id: 103, uuid: ME, type: "waypoint", content: WAYPOINT, createdAt: at("19:12") })],
    }),
    typing: true,
  },
  {
    chat: contact({
      id: 5,
      name: "Servidor · General",
      type: CHAT_TYPE.PUBLIC,
      muted: true,
      pinned: true,
      messages: [msg({ id: 104, uuid: MARTA, type: "text", content: "Reinicio programado a las 04:00", createdAt: at("17:40") })],
    }),
  },
  {
    chat: contact({
      id: 6,
      name: "Mensajes guardados",
      type: CHAT_TYPE.SAVED,
      presence: "offline",
      messages: [msg({ id: 105, uuid: ME, type: "document", content: DOCUMENT, createdAt: at("11:02") })],
    }),
  },
]

export function CaMensajeriaChapter() {
  // The Composer focuses its textarea whenever a reply arrives, so the reply specimen must
  // start empty: mounting it with `reply` already set would steal focus and scroll the
  // showcase container down to it on every visit to the chapter.
  const [reply, setReply] = React.useState<ChatMessageVM | null>(null)

  return (
    <>
      <Section
        id="ca-burbujas"
        kicker="ChatApp"
        title="Burbujas y recibos"
        lead="MessageRow es el componente más denso del sistema: decide entrante o saliente, agrupa mensajes consecutivos del mismo autor, dibuja la cola solo en el primero de la racha y cambia de forma entera según el tipo. Diez tipos, una sola fila."
      >
        <Sample
          app="ca"
          title="Entrante, saliente y agrupación"
          code="MessageRow"
          padded={false}
          note={
            <>
              La cola (ese pico en la esquina) solo aparece en el primer mensaje de cada racha; los siguientes se pegan
              con 1&nbsp;px de separación. En grupos, el avatar se dibuja en el <em>último</em> de la racha y el nombre en
              el primero. Pasa el ratón por encima para ver las herramientas de reacción y respuesta.
            </>
          }
        >
          <ThemePair>
            <Thread items={TEXTS} />
          </ThemePair>
        </Sample>

        <Sample
          app="ca"
          title="Recibos de lectura"
          code="status: sent | delivered | read"
          padded={false}
          note={
            <>
              Solo los mensajes salientes llevan tick. <code>read</code> es el único que colorea, y usa{" "}
              <code>--ca-tick-read</code> (azul), que es constante en ambos temas: el acento no se mete aquí.
            </>
          }
        >
          <ThemePair>
            <Thread items={RECEIPTS} isGroup={false} />
          </ThemePair>
        </Sample>

        <Sample
          app="ca"
          title="Respuesta y reacciones"
          code="replyTo · reactions"
          padded={false}
          note={
            <>
              La cita resuelve el mensaje original dentro del propio <code>chat.messages</code> y muestra una vista previa
              por tipo. Las reacciones propias se marcan con un anillo de acento. <code>replyTo</code> está marcado{" "}
              <code>[deferred]</code> en el modelo de vista: la API todavía no persiste respuestas.
            </>
          }
        >
          <ThemePair>
            <Thread items={REPLIES} />
          </ThemePair>
        </Sample>

        <Sample
          app="ca"
          title="Tarjetas: captura, ubicación, nota, vídeo, sticker y emoji"
          code="type: image | waypoint | document | video | sticker | emoji"
          padded={false}
          note={
            <>
              El contenido de estos tipos viaja como JSON en <code>content</code> y se parsea en{" "}
              <code>_utils/messageContent.ts</code>. La captura despliega los detalles del escaneo (posición y entidades
              detectadas); la ubicación puede añadirse como waypoint real vía MCEF. Las imágenes de ejemplo son datos de
              demostración.
            </>
          }
        >
          <ThemePair>
            <Thread items={CARDS} />
          </ThemePair>
        </Sample>

        <Sample
          app="ca"
          title="Llamadas y avisos del sistema"
          code="type: call | system"
          padded={false}
          note="Ninguno de los dos es una burbuja: la llamada es una tarjeta centrada con acción de devolver, y el aviso del sistema es una píldora centrada sin autor. Por eso quedan fuera del cálculo de agrupación."
        >
          <ThemePair>
            <Thread items={EVENTS} />
          </ThemePair>
        </Sample>
      </Section>

      <Section
        id="ca-contactos"
        kicker="ChatApp"
        title="Fila de contacto"
        lead="Una fila de la bandeja resume un chat entero: quién, cuándo, qué fue lo último (con su icono de tipo) y en qué estado está — activo, no leído, silenciado, fijado o escribiendo."
      >
        <Sample
          app="ca"
          title="ContactRow"
          code="chat · active · typing"
          padded={false}
          note={
            <>
              La vista previa la calcula <code>previewOf()</code>: prefija «Tú:» en lo propio, el nombre del autor en
              grupos, y sustituye el texto por un icono y una etiqueta cuando el último mensaje es adjunto. El punto de
              presencia solo se dibuja en chats directos. Escribiendo… sustituye la vista previa por los puntos.
            </>
          }
        >
          <ThemePair>
            <div className="w-full overflow-hidden rounded-[12px] bg-ca-panel">
              {CONTACTS.map((c) => (
                <ContactRow
                  key={c.chat.id}
                  chat={c.chat}
                  active={!!c.active}
                  typing={c.typing}
                  myUuid={ME}
                  onClick={noop}
                />
              ))}
            </div>
          </ThemePair>
        </Sample>
      </Section>

      <Section
        id="ca-redactor"
        kicker="ChatApp"
        title="Redactor"
        lead="La barra de escritura: textarea que crece hasta 120 px, menú de adjuntos a la izquierda, emojis y stickers a la derecha, y un único botón de acción que alterna entre enviar y nota de voz según haya texto."
      >
        <Sample
          app="ca"
          title="Composer"
          code="onSendText · onSendSticker · onTyping"
          padded={false}
          note={
            <>
              Escribe algo para ver cómo el micrófono se convierte en el avión de papel. La nota de voz está marcada{" "}
              <code>[deferred]</code>: no hay API de audio, así que el botón solo avisa de que llegará. En el catálogo
              los envíos son inertes (los <em>handlers</em> son no-ops), pero los menús, el crecimiento del textarea y
              los selectores son los reales.
            </>
          }
        >
          <ThemePair>
            <div className="w-full">
              <div className="relative h-[170px] overflow-hidden rounded-t-[12px] bg-ca-wallpaper">
                <div className="ca-doodle pointer-events-none absolute inset-0" />
              </div>
              <Composer
                reply={null}
                session={null}
                onSendText={noop}
                onSendSticker={noop}
                onOpenPhoto={noop}
                onOpenWaypoint={noop}
                onOpenDocument={noop}
                onTyping={noop}
                clearReply={noop}
              />
            </div>
          </ThemePair>
        </Sample>

        <Sample
          app="ca"
          title="Respondiendo"
          code="reply · clearReply"
          padded={false}
          note="Con una respuesta activa, el redactor crece una barra de cita por encima y enfoca el textarea. La X la descarta. Pulsa el botón para activarla: el especímen arranca sin respuesta porque montarlo con una ya puesta robaría el foco al entrar en el capítulo."
        >
          <ThemePair>
            <div className="w-full">
              <div className="relative flex h-[130px] items-center justify-center overflow-hidden rounded-t-[12px] bg-ca-wallpaper">
                <div className="ca-doodle pointer-events-none absolute inset-0" />
                <Button className="relative" onClick={() => setReply(reply ? null : REPLY_TARGET)}>
                  {reply ? "Descartar la respuesta" : "Responder a Marta"}
                </Button>
              </div>
              <Composer
                reply={reply}
                session={DEMO_SESSION}
                onSendText={noop}
                onSendSticker={noop}
                onOpenPhoto={noop}
                onOpenWaypoint={noop}
                onOpenDocument={noop}
                onTyping={noop}
                clearReply={() => setReply(null)}
              />
            </div>
          </ThemePair>
        </Sample>
      </Section>
    </>
  )
}
