"use client"

import * as React from "react"
import {
  AuthorLine,
  Avatar,
  Button,
  CharRing,
  EmptyState,
  FeedSkeleton,
  Icon,
  Pill,
  RookerMark,
  SearchBar,
  SectionTitle,
  SegTabs,
  Skeleton,
  SubHeader,
  Verified,
} from "@/app/smartrotom/rooker/_components/ui"
import { Sample, Section } from "../showcase-shared"
import { RK_DEMO_AUTHOR } from "./rk-demo"

export function RkPrimitivasChapter() {
  const [tab, setTab] = React.useState<"parati" | "siguiendo">("parati")
  const [chars, setChars] = React.useState(212)

  return (
    <>
      <Section
        id="rk-botones"
        kicker="Rooker"
        title="Botones"
        lead={
          <>
            Cuatro intenciones, una forma. <code>follow</code> y <code>following</code> son dos
            intenciones y no una sola con booleano, porque son botones distintos: «Seguir» es tinta
            maciza sobre el lienzo y «Siguiendo» es un contorno que se pone rojo al pasar por
            encima — la única forma de dejar de seguir.
          </>
        }
      >
        <Sample title="Intenciones" code='<Button intent="accent" | "follow" | "following" | "ghost" />' app="rk">
          <div className="flex flex-wrap items-center gap-2.5">
            <Button intent="accent">Trinar</Button>
            <Button intent="follow">Seguir</Button>
            <Button intent="following">Siguiendo</Button>
            <Button intent="ghost">Editar perfil</Button>
            <Button intent="accent" disabled>
              Publicando…
            </Button>
          </div>
        </Sample>

        <Sample
          title="El acento se atenúa con filtro, no con color"
          code="hover:brightness-[.92]"
          app="rk"
          note="El fondo es rgb(var(--rk-accent)), una custom property viva. Chromium deja varada una transición de color cuyo extremo es un var() — el botón se queda a medio fundido. El brillo lo aplica el compositor y esquiva el bug entero."
        >
          <Button intent="accent">Pasa el ratón por encima</Button>
        </Sample>
      </Section>

      <Section
        id="rk-identidad"
        kicker="Rooker"
        title="Identidad"
        lead={
          <>
            El handoff dibujaba los avatares como Pokémon dentro de un disco. Eso era ficción: un
            usuario de SmartRotom <em>es</em> una cuenta de Minecraft, y su skin ya es su cara en
            ChatApp y en el Pasaporte. Así que la cara es la cabeza real y el Pokémon pasa a ser lo
            que siempre debió ser — el <strong>compañero</strong> que tiñe el anillo y el banner.
            Identidad debajo, personalidad alrededor.
          </>
        }
      >
        <Sample title="Avatar" code="<Avatar user={author} size={46} />" app="rk">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar user={RK_DEMO_AUTHOR} size={80} />
            <Avatar user={RK_DEMO_AUTHOR} size={46} />
            <Avatar user={RK_DEMO_AUTHOR} size={40} />
            <Avatar user={RK_DEMO_AUTHOR} size={30} ring={false} />
          </div>
        </Sample>

        <Sample
          title="La línea del autor"
          code="<AuthorLine author={…} createdAt={…} />"
          app="rk"
          note="El nombre encoge 1px en compacto y la fila se envuelve en lugar de truncar: un nombre de Minecraft puede tener 16 caracteres y un handle 32, y cortar el handle es peor que una segunda línea."
        >
          <div className="space-y-2">
            <AuthorLine author={RK_DEMO_AUTHOR} createdAt={new Date(Date.now() - 7.2e6).toISOString()} />
            <AuthorLine
              author={{ ...RK_DEMO_AUTHOR, isVerified: true }}
              createdAt={new Date(Date.now() - 7.2e6).toISOString()}
              compact
            />
          </div>
        </Sample>

        <Sample
          title="Marca, píldoras y verificación"
          code="<RookerMark /> · <Pill /> · <Verified />"
          app="rk"
          note="Verified está construido pero nunca se pinta: rotom_users no tiene columna de rol y el join con boffmedia_user_roles no está cableado, así que la API fija isVerified en false. Es un [deferred] honesto — encenderlo es un cambio de servidor, no de diseño."
        >
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-rk-accent">
              <RookerMark size={32} />
            </span>
            <Verified size={20} />
            <Pill className="border border-rk-accent/30 bg-rk-accent/15 text-rk-accent">
              <Icon name="plus" size={10} /> Captura
            </Pill>
            <Pill className="border border-rk-shiny/45 bg-rk-shiny/20 text-rk-shiny">★ Shiny</Pill>
            <Pill className="bg-rk-live text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" /> En vivo
            </Pill>
          </div>
        </Sample>
      </Section>

      <Section
        id="rk-navegacion"
        kicker="Rooker"
        title="Cabeceras y pestañas"
        lead={
          <>
            La cabecera se pega arriba y desenfoca la línea de tiempo que corre por debajo — por eso{" "}
            <code>bg-rk-nav</code> es un color translúcido ya compuesto y no un token con canal
            alfa: un <code>/85</code> sobre el triplete desenfocaría la capa equivocada.
          </>
        }
      >
        <Sample title="SubHeader" code="<SubHeader title back right />" app="rk" padded={false}>
          <SubHeader title="Trino" back />
        </Sample>

        <Sample
          title="SegTabs"
          code="<SegTabs tabs active onChange />"
          app="rk"
          padded={false}
          note="La barra activa (38×4) es más estrecha que la pestaña a propósito: subraya la etiqueta, no selecciona un segmento."
        >
          <SegTabs
            active={tab}
            onChange={setTab}
            tabs={[
              { key: "parati", label: "Para ti" },
              { key: "siguiendo", label: "Siguiendo" },
            ]}
          />
        </Sample>

        <Sample title="SectionTitle" code="<SectionTitle icon title action />" app="rk">
          <SectionTitle icon="trending" title="Tendencias" />
        </Sample>
      </Section>

      <Section
        id="rk-formularios"
        kicker="Rooker"
        title="Búsqueda y contador"
        lead="El campo se llena del color de tarjeta en reposo y salta al lienzo con borde de acento al enfocarse: se «levanta» del rail en lugar de brillar."
      >
        <Sample title="SearchBar" code="<SearchBar onChange />" app="rk">
          <SearchBar />
        </Sample>

        <Sample
          title="CharRing"
          code="<CharRing count={212} />"
          app="rk"
          note="Sólo cuenta con cifras cuando quedan menos de 20: antes de eso el arco basta y el número sería ruido. Pasado el límite se pone rojo y es lo que bloquea el botón."
        >
          <div className="flex items-center gap-6">
            <CharRing count={chars} />
            <input
              type="range"
              min={0}
              max={300}
              value={chars}
              onChange={(e) => setChars(Number(e.target.value))}
              aria-label="Caracteres"
              className="w-56 accent-[rgb(var(--rk-accent))]"
            />
            <span className="font-mono text-[12px] tabular-nums text-rk-fg-subtle">{chars}/280</span>
          </div>
        </Sample>
      </Section>

      <Section
        id="rk-estados"
        kicker="Rooker"
        title="Vacíos y carga"
        lead={
          <>
            El nido vacío <em>no</em> es un caso límite: Rooker no trae ni un trino inventado, así
            que la línea de tiempo empieza literalmente en cero y ésta es la primera pantalla que
            verá cualquiera. Por eso dice qué hacer, en vez de disculparse.
          </>
        }
      >
        <Sample title="EmptyState" code="<EmptyState icon title body action />" app="rk" padded={false}>
          <EmptyState
            title="El nido está vacío"
            body="Nadie ha trinado todavía. Sé el primero: cuenta una captura, reta a alguien o simplemente saluda."
            action={<Button intent="accent">Escribir el primer trino</Button>}
          />
        </Sample>

        <Sample
          title="Skeleton"
          code="<FeedSkeleton rows={2} /> · <Skeleton />"
          app="rk"
          padded={false}
          note="Con la forma de los trinos que sustituye, para que la maqueta no salte cuando llegan los de verdad."
        >
          <FeedSkeleton rows={2} />
        </Sample>

        <Sample title="Skeleton suelto" code="<Skeleton className='h-3 w-40' />" app="rk">
          <div className="space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-11 w-11 rounded-full" />
          </div>
        </Sample>
      </Section>
    </>
  )
}
