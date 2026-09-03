"use client"

import * as React from "react"
import { Sample, Section } from "../showcase-shared"
import {
  ComicBurst,
  FurretMascot,
  HeroArt,
  Marquee,
  Pill,
  SectionHeader,
  SpeechBubble,
  Sticker,
} from "../../../furrettoday/_components/ui"

// Specimen copy only — the real screens read the newsroom. Nothing here is
// wired to data, and nothing here ships to a user.
const TICKER = [
  "CA-MI-NAR",
  "ABSOL DEMANDA A LOS MEDIOS",
  "CRISIS DIPLOMÁTICA EN JOHTO",
  "BLAINE ANUNCIA SU RETIRADA",
]

const BODY = `<p>Hay Pokémon que ganan torneos y Pokémon que ganan corazones. Furret pertenece, sin discusión, al segundo grupo. Sus estadísticas no impresionan a nadie y, sin embargo, lleva años apareciendo en avatares y carteles de torneos.</p>
<h2>Un cuerpo larguísimo y una promesa</h2>
<p>Furret mide 1.8 metros. En la práctica, eso significa que su silueta funciona casi como un <strong>logotipo</strong>.</p>
<blockquote>No fue elegido. Se eligió a sí mismo.</blockquote>`

export function FtQuioscoChapter() {
  return (
    <>
      <Section
        id="ft-viñeta"
        kicker="Furret Today"
        title="Viñeta"
        lead="El vocabulario de cómic: la mascota, el estallido, el bocadillo y la pegatina. Todo es SVG en línea — la mascota es a la vez el logo, el estado vacío y la portada, así que tiene que escalar de 40 a 420 px sin un solo píxel."
      >
        <Sample
          title="La mascota"
          code="FurretMascot size"
          app="ft"
          note="Sirve de logotipo en la cabecera, de ilustración de portada y de estado vacío."
        >
          <div className="flex flex-wrap items-end gap-6">
            <FurretMascot size={64} />
            <FurretMascot size={120} />
            <FurretMascot size={180} />
          </div>
        </Sample>

        <Sample
          title="Estallidos, bocadillos y pegatinas"
          code="ComicBurst · SpeechBubble · Sticker bob"
          app="ft"
          note="El texto del estallido se dimensiona en proporción al tamaño (0.18×) para que la palabra siempre quepa entre las púas."
        >
          <div className="flex flex-wrap items-center gap-8">
            <ComicBurst size={110} color="#00c4d4" text="POW!" />
            <ComicBurst size={110} color="#ff2d87" textColor="#fff" text="NEW!" />
            <SpeechBubble>
              <span className="font-ft-display text-2xl leading-none">CA·MI·NAR</span>
              <div className="font-ft-deck text-[0.8125rem] italic text-ft-deck">
                (verbo. ver pág. 12)
              </div>
            </SpeechBubble>
            <Sticker bob>¡Exclusiva!</Sticker>
          </div>
        </Sample>

        <Sample
          title="Ticker"
          code="Marquee items tone label"
          app="ft"
          note="La pista lleva los titulares DOS veces y se desplaza exactamente -50%: la segunda copia cae donde empezaba la primera y el bucle no tiene costura. La mitad duplicada va con `aria-hidden` para que el lector de pantalla no lea los titulares dos veces."
          padded={false}
        >
          <Marquee items={TICKER} tone="yellow" label="Titulares" />
        </Sample>
      </Section>

      <Section
        id="ft-portada"
        kicker="Furret Today"
        title="Portada"
        lead="La cabecera de sección y la ilustración de artículo. `HeroArt` enseña la imagen real cuando la redacción puso una; cuando no —que es lo normal— dibuja la ilustración de la casa, con lo que un artículo sin foto sigue pareciendo publicado."
      >
        <Sample title="Cabecera de sección" code="SectionHeader eyebrow title number hint" app="ft">
          <SectionHeader
            eyebrow="Lo más leído esta semana"
            title="Las Tres en Boca de Todos"
            number="01"
            hint="↓ Desliza"
          />
        </Sample>

        <Sample
          title="Ilustración"
          code="HeroArt accent src mascot burst"
          app="ft"
          note="Sin `src` dibuja la trama del acento + la mascota. Una `imageUrl` rota cae en el mismo dibujo en vez de dejar un marco en blanco que rompería la rejilla."
        >
          <div className="grid grid-cols-3 gap-3">
            <HeroArt accent="pink" burst="POW!" className="h-40 rounded-ft border-ft border-ft-ink" />
            <HeroArt accent="cyan" className="h-40 rounded-ft border-ft border-ft-ink" />
            <HeroArt
              accent="lime"
              mascot={false}
              className="h-40 rounded-ft border-ft border-ft-ink"
            />
          </div>
        </Sample>

        <Sample
          title="Portada de tinta"
          code="ft-cover-ink · ft-halftone-light · ft-halftone-mask"
          app="ft"
          note="La portada oscura es una SECCIÓN, no un tema: la app no tiene eje claro/oscuro."
          padded={false}
        >
          <div className="ft-cover-ink relative overflow-hidden p-8">
            <div
              className="ft-halftone-light ft-halftone-mask absolute inset-0 opacity-20"
              aria-hidden="true"
            />
            <div className="relative">
              <Pill tone="pink">Portada · Edición especial</Pill>
              <h3 className="font-ft-display mt-3 text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.86] text-ft-yellow">
                La Dinastía Furret
              </h3>
              <p className="font-ft-deck mt-3 max-w-[46ch] text-xl italic text-white/85">
                Cómo un Pokémon de tipo normal se convirtió en la mascota de toda una
                comunidad.
              </p>
            </div>
          </div>
        </Sample>
      </Section>

      <Section
        id="ft-articulo"
        kicker="Furret Today"
        title="Artículo"
        lead="El cuerpo del artículo es HTML escrito en CKEditor, así que no controlamos ni una clase dentro: `ft-article` estiliza cada etiqueta (p, h2, strong, a, blockquote, img, figcaption) y `ft-dropcap` pone la capitular de cómic."
      >
        <Sample
          title="Cuerpo"
          code="ft-article · ft-dropcap"
          app="ft"
          note="La negrita se pinta como un subrayado fluorescente sobre la palabra; la cita lleva filete rosa. Al inyectar, se quita el `<h1>` inicial: el cuerpo repite el titular y se imprimiría dos veces."
        >
          <div
            className="ft-article ft-dropcap max-w-[62ch]"
            dangerouslySetInnerHTML={{ __html: BODY }}
          />
        </Sample>
      </Section>
    </>
  )
}
