"use client"

import * as React from "react"
import { Sample, Section } from "../showcase-shared"
import {
  Byline,
  CategoryTile,
  CmAvatar,
  CmTags,
  ForumStats,
  OnlineList,
  PostBody,
  PostCard,
  ThreadRow,
  VoteRail,
} from "@/components/boffmedia/ui/community"
import { CM_AUTHORS, CM_FORUM_CATEGORIES, CM_FORUM_STATS, CM_FORUM_THREADS, CM_ONLINE, CM_POSTS } from "./comunidad-demo"

const noop = () => {}

export function ComunidadChapter() {
  const [voteA, setVoteA] = React.useState(0)
  const [voteB, setVoteB] = React.useState(0)

  const featured = CM_POSTS.find((p) => p.featured) || CM_POSTS[0]

  return (
    <>
      <Section
        id="cmcard"
        kicker="Comunidad"
        title="Tarjeta de artículo"
        lead={
          <>
            La pieza que puebla el Blog. Un solo componente <code>&lt;PostCard&gt;</code> con cuatro pieles: <code>feature</code> (destacada con portada e{" "}
            <code>image-slot</code>), <code>grid</code> (rejilla), <code>row</code> (lista horizontal) y <code>mini</code> (barra lateral). El rail de acento y el glifo se tiñen con el hue de la categoría.
          </>
        }
      >
        <Sample
          title="Destacada"
          code={`<PostCard variant="feature">`}
          col
          note={<>El panel de imagen es un <code>&lt;image-slot&gt;</code>: se conectará a la subida de imágenes. El glifo tinteado queda de fondo mientras tanto. [aplazado]</>}
        >
          <div className="w-full">
            <PostCard post={featured} variant="feature" onOpen={noop} />
          </div>
        </Sample>
        <Sample title="Rejilla y lista" code={`variant="grid" · "row" · "mini"`} col>
          <div className="grid w-full gap-[1.125rem]">
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(18.75rem,1fr))]">
              {CM_POSTS.slice(2, 5).map((p) => (
                <PostCard key={p.id} post={p} variant="grid" onOpen={noop} />
              ))}
            </div>
            <PostCard post={CM_POSTS[6]} variant="row" onOpen={noop} />
            <div className="max-w-[21.25rem] border border-solid border-line bg-panel px-4 py-1.5">
              {CM_POSTS.slice(0, 2).map((p) => (
                <PostCard key={p.id} post={p} variant="mini" onOpen={noop} />
              ))}
            </div>
          </div>
        </Sample>
      </Section>

      <Section
        id="cmauthor"
        kicker="Comunidad"
        title="Autoría y etiquetas"
        lead={
          <>
            La firma compartida por Blog y Foro. <code>&lt;CmAvatar&gt;</code> es la inicial recortada teñida por el tono del autor; <code>&lt;Byline&gt;</code> la combina con nombre enlazado y meta; <code>&lt;CmTags&gt;</code> renderiza las etiquetas <code>#hashtag</code>.
          </>
        }
      >
        <Sample title="Avatares por tono" code="<CmAvatar author>">
          {CM_AUTHORS.slice(0, 5).map((a) => (
            <CmAvatar key={a.id} author={a} />
          ))}
        </Sample>
        <Sample title="Byline" code="<Byline author when>" col>
          <div className="grid gap-[0.875rem]">
            <Byline author={CM_AUTHORS[1]} when={CM_POSTS[0].publishedAt} onOpen={noop} />
            <Byline author={CM_AUTHORS[2]} sub={CM_AUTHORS[2].role} size={38} onOpen={noop} />
          </div>
        </Sample>
        <Sample title="Etiquetas" code="<CmTags tags>">
          <CmTags tags={["regulación", "meta", "series-h"]} onOpen={noop} />
        </Sample>
      </Section>

      <Section
        id="cmprose"
        kicker="Comunidad"
        title="Cuerpo de artículo"
        lead={
          <>
            <code>&lt;PostBody&gt;</code> renderiza un array de bloques a prosa Señal: encabezados en italic, párrafos, listas con marca diamante, cita con barra de acento, bloque de código en mono y nota destacada en cuatro tonos.
          </>
        }
      >
        <Sample title="Bloques" code="<PostBody blocks>" col>
          <PostBody
            blocks={[
              { h: "Cómo prepararse" },
              { p: "Antes de fijar tu lista, pasa por la herramienta de Meta VGC y el calculador de daño: los rangos cambian mucho sin los atacantes de élite del formato anterior." },
              { list: ["Estructuras de Trick Room pasan a ser un pilar.", "Los intimidadores recuperan valor.", "El soporte con redirección por fin brilla."] },
              { quote: "Hacía dos temporadas que no me divertía tanto construyendo.", cite: "Comentario de la comunidad" },
              { note: "Abre la herramienta de Meta VGC desde Herramientas → Pokémon VGC para ver el uso actualizado.", tone: "info", title: "Dato útil" },
            ]}
          />
        </Sample>
      </Section>

      <Section
        id="cmcat"
        kicker="Comunidad"
        title="Categoría del foro"
        lead={
          <>
            La entrada a cada tablón en el Foro. <code>&lt;CategoryTile&gt;</code> lleva icono teñido por hue, descripción, contadores de hilos/posts y la última actividad con byline. Deriva sus cifras del store en vivo.
          </>
        }
      >
        <Sample title="Tarjetas" code="<CategoryTile cat go>" col>
          <div className="grid w-full gap-3">
            {CM_FORUM_CATEGORIES.slice(1, 3).map((c) => (
              <CategoryTile key={c.id} cat={c} onOpen={noop} />
            ))}
          </div>
        </Sample>
      </Section>

      <Section
        id="cmthread"
        kicker="Comunidad"
        title="Hilo del foro"
        lead={
          <>
            <code>&lt;ThreadRow&gt;</code> es la fila de hilo: sello del autor teñido por categoría, indicadores de fijado/cerrado/resuelto, meta en mono y contadores de respuestas y vistas. <code>compact</code> reduce la altura; <code>showCat</code> añade la categoría a la meta.
          </>
        }
      >
        <Sample title="Filas" code="<ThreadRow thread showCat compact>" col>
          <div className="w-full border border-solid border-line bg-panel">
            {CM_FORUM_THREADS.slice(0, 4).map((t) => (
              <ThreadRow key={t.id} thread={t} onOpen={noop} showCat />
            ))}
          </div>
        </Sample>
      </Section>

      <Section
        id="cmvote"
        kicker="Comunidad"
        title="Voto y miembros"
        lead={
          <>
            El riel <code>&lt;VoteRail&gt;</code> vota posts arriba/abajo con recuento vivo, <code>&lt;CmMemberRow&gt;</code> es la fila de miembro (avatar, estado, rol) y <code>&lt;OnlineList&gt;</code> / <code>&lt;ForumStats&gt;</code> son los widgets de la barra lateral del Foro.
          </>
        }
      >
        <Sample title="Riel de voto" code="<VoteRail votes vote onVote>">
          <VoteRail votes={37} vote={voteA} onVote={setVoteA} />
          <VoteRail votes={14} vote={voteB} onVote={setVoteB} row />
        </Sample>
        <Sample title="Widgets de barra lateral" code="<OnlineList> · <ForumStats>" col>
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            <OnlineList members={CM_ONLINE} onOpen={noop} />
            <ForumStats stats={CM_FORUM_STATS} />
          </div>
        </Sample>
      </Section>
    </>
  )
}
