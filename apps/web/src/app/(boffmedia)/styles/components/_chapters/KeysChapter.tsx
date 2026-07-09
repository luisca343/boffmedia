"use client"

import { Sample, Section } from "../showcase-shared"
import { KvArt, KvCard, KvGallery, KvInfo, KvPlatforms, KvPrice, KvReview, KvScores, KvStatus, KvVia, kvMedia } from "@/components/boffmedia/ui/keys"
import { KV_KEYS } from "./keys-demo"

const noop = () => {}

export function KeysChapter() {
  const a = KV_KEYS.find((k) => k.price.discount > 0) || KV_KEYS[0]
  const b = KV_KEYS.find((k) => k.given) || KV_KEYS[1]

  return (
    <>
      <Section
        id="kvatoms"
        kicker="Claves de Steam"
        title="Estado, arte y valoración"
        lead={
          <>
            Los átomos del catálogo. <code>&lt;KvStatus&gt;</code> distingue disponible de entregada; <code>&lt;KvVia&gt;</code> etiqueta la vía de reparto (sorteo o entrega manual — la clave nunca se muestra); <code>&lt;KvArt&gt;</code> trae el arte real de Steam con fallback rayado; <code>&lt;KvReview&gt;</code> traduce la valoración a barra (verde ≥95, azul ≥85, ámbar).
          </>
        }
      >
        <Sample title="Estado y vía" code="<KvStatus> · <KvVia>">
          <KvStatus given={false} />
          <KvStatus given />
          <KvVia via="sorteo" />
          <KvVia via="manual" />
        </Sample>
        <Sample title="Valoración y plataformas" code="<KvReview> · <KvPlatforms>" col>
          <div className="grid w-full max-w-[340px] gap-3">
            <KvReview score={98} count={358120} />
            <KvReview score={92} count={720100} />
            <KvPlatforms platforms={["win", "mac", "linux"]} />
          </div>
        </Sample>
        <Sample title="Arte de Steam" code={`<KvArt kind="header">`} col note="Si el CDN de Steam no responde, aparece el fallback rayado con el nombre del juego.">
          <div className="grid w-full max-w-[480px] grid-cols-2 gap-3">
            <div className="aspect-[460/200] border border-solid border-line">
              <KvArt appid={a.appid} name={a.name} kind="header" />
            </div>
            <div className="aspect-[460/200] border border-solid border-line">
              <KvArt appid={999999999} name="Fallback" kind="header" />
            </div>
          </div>
        </Sample>
      </Section>

      <Section
        id="kvsections"
        kicker="Claves de Steam"
        title="Ficha de Steam · info · precio · media"
        lead={
          <>
            El detalle reproduce las tres secciones de la API <code>appdetails</code> de Steam. <code>&lt;KvInfo&gt;</code> lista desarrollador, editor, lanzamiento y plataformas en rejilla par, y cierra con <code>&lt;KvScores&gt;</code> — que junta Metacritic y la valoración de Steam. <code>&lt;KvPrice&gt;</code> muestra el <code>price_overview</code> con descuento; <code>&lt;KvGallery&gt;</code> es el carrusel de medios con miniaturas.
          </>
        }
      >
        <Sample title="Info" code="<KvInfo item>" col>
          <div className="w-full max-w-[480px]">
            <KvInfo item={a} />
          </div>
        </Sample>
        <Sample title="Recepción · Metacritic + Steam" code="<KvScores info>" col note="Consolida las dos puntuaciones. Si el juego no tiene Metacritic, la valoración de Steam ocupa todo el ancho.">
          <div className="grid w-full max-w-[480px] gap-3">
            <KvScores info={a.info} />
            <KvScores info={{ ...b.info, metacritic: null }} />
          </div>
        </Sample>
        <Sample title="Precio (con descuento)" code="<KvPrice price>" col>
          <div className="w-full max-w-[340px]">
            <KvPrice price={a.price} />
          </div>
        </Sample>
        <Sample title="Media" code="<KvGallery images>" col note="Clic en las miniaturas para cambiar el medio principal. Los medios se sirven del CDN de Steam por appid.">
          <div className="w-full max-w-[480px]">
            <KvGallery images={kvMedia(a.appid)} name={a.name} />
          </div>
        </Sample>
      </Section>

      <Section
        id="kvcard"
        kicker="Claves de Steam"
        title="Tarjeta de juego"
        lead={<>La pieza que puebla el catálogo. <code>&lt;KvCard&gt;</code> combina arte de Steam con estado, valoración, descuento y stock superpuestos, nombre, precio, etiquetas y la vía de entrega al pie. Las entregadas se atenúan.</>}
      >
        <Sample title="Rejilla" code="<KvCard item onOpen>" col>
          <div className="grid w-full gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
            <KvCard item={a} onOpen={noop} />
            <KvCard item={b} onOpen={noop} />
          </div>
        </Sample>
      </Section>
    </>
  )
}
