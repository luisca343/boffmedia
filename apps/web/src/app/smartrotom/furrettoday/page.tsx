"use client";

import React from "react";
import Image from "next/image";
import MainCard from "./_components/MainCard";
import CardComponent from "./_components/CardComponent";
import PopStyles from "./_components/PopStyles";
import FurretHeader from "./_components/Header";
import FurretFooter from "./_components/Footer";
import PopArtWallpaper from "./_components/PopArtWallpaper";
import { useGetAllNews } from "@/hooks/documents/useGetAllNews";
import { InternalLink } from "@/components/ui/navigation/Link";

export interface NewsItem {
  id: number;
  title: string;
  subtitle?: string;
  content: string;
  buttonText: string;
  imageUrl: string;
  author?: string;
  category?: string;
  readtime?: string;
}

/* ---------- Marquee ticker ---------- */
function Ticker({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="ft-marquee" role="marquee" aria-label="Titulares">
      <div className="ft-marquee__track">
        {doubled.map((t, i) => (
          <span key={i} className="ft-marquee__item">
            <span className="ft-marquee__sep" aria-hidden="true"></span>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Section header ---------- */
function SectionHeader({ eyebrow, title, number }: { eyebrow: string; title: string; number: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, borderBottom: "var(--ft-border)", paddingBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 18 }}>
        <span className="ft-stamp">{number}</span>
        <div>
          <div className="ft-eyebrow" style={{ color: "var(--ft-pink)" }}>{eyebrow}</div>
          <h2 className="ft-display" style={{ margin: "4px 0 0", fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 0.95 }}>
            {title}
          </h2>
        </div>
      </div>
    </div>
  );
}

/* ---------- Subscribe strip ---------- */
function SubscribeStrip() {
  return (
    <section className="ft-wrap-wide" style={{ padding: "24px 24px" }}>
      <div className="ft-card" style={{
        background: "var(--ft-yellow)",
        padding: "28px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{
            background: "var(--ft-pink)", color: "#fff",
            fontFamily: "var(--ft-font-display)", fontSize: 20,
            padding: "10px 18px", borderRadius: 999,
            border: "var(--ft-border)", boxShadow: "var(--ft-shadow-pop-sm)",
            transform: "rotate(-4deg)",
          }}>
            ¡POP!
          </div>
          <div>
            <div className="ft-eyebrow" style={{ color: "var(--ft-ink)" }}>SEMANARIO</div>
            <h3 className="ft-display" style={{ margin: "2px 0 6px", fontSize: 36, lineHeight: 1 }}>
              Furret en tu SmartRotom cada semana
            </h3>
            <p className="ft-body" style={{ margin: 0 }}>
              Noticias, meta, torneos y diversión de la comunidad Pokémon.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Collector strip ---------- */
function CollectorStrip() {
  const issues = [
    { n: 46, t: "Pikachu en el ladder", c: "var(--ft-yellow)" },
    { n: 45, t: "El año del Snorlax", c: "var(--ft-cyan)" },
    { n: 44, t: "TCG: el oro de mayo", c: "var(--ft-orange)" },
    { n: 43, t: "Liga BoffMedia", c: "var(--ft-pink)" },
    { n: 42, t: "Shinies: la verdad", c: "var(--ft-purple)" },
    { n: 41, t: "VGC para todos", c: "var(--ft-lime)" },
  ];
  return (
    <section className="ft-wrap-wide" style={{ padding: "16px 24px 32px" }}>
      <SectionHeader eyebrow="ARCHIVO COLECCIONABLE" title="Números Anteriores" number="03" />
      <div className="ft-scroll" style={{
        display: "grid",
        gridAutoFlow: "column",
        gridAutoColumns: "minmax(220px, 1fr)",
        gap: 18,
        marginTop: 28,
        overflowX: "auto",
        paddingBottom: 12,
      }}>
        {issues.map((iss) => (
          <div key={iss.n} className="ft-card ft-lift" style={{
            textAlign: "left", padding: 0, overflow: "hidden", background: "#fff",
          }}>
            <div style={{
              position: "relative", height: 220, background: iss.c, borderBottom: "var(--ft-border)",
              backgroundImage: "radial-gradient(var(--ft-ink) 1.4px, transparent 1.6px)",
              backgroundSize: "12px 12px",
            }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "relative", width: 120, height: 120 }}>
                  <Image src="/smartrotom/img/apps/furrettoday/furret2.png" alt="Furret" fill className="object-contain" style={{ transform: "rotate(-6deg)" }} />
                </div>
              </div>
              <span className="ft-pill is-paper" style={{ position: "absolute", top: 10, left: 10 }}>Nº {iss.n}</span>
            </div>
            <div style={{ padding: "12px 14px" }}>
              <div className="ft-display" style={{ fontSize: 22, lineHeight: 1 }}>{iss.t}</div>
              <div className="ft-meta" style={{ marginTop: 4 }}>2026</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Main page ---------- */
export default function FurretToday() {
  const { featured, published } = useGetAllNews();

  const allTitles = [
    ...(featured ? [featured.title] : []),
    ...published.map((n) => n.title),
  ].slice(0, 8);
  const tickerItems = allTitles.length > 0
    ? allTitles.map((t) => t.toUpperCase())
    : ["FURRET TODAY", "SEMANARIO POP"];

  const footerCategories = Array.from(
    new Set(published.map((n) => n.category).filter((c): c is string => Boolean(c)))
  );

  return (
    <div className="ft-root" style={{ position: "relative" }}>
      <PopArtWallpaper />
      <div style={{ position: "relative", zIndex: 1 }}>
        <FurretHeader />

        {/* Cover hero */}
        <section style={{
          borderBottom: "var(--ft-border)",
          background: "var(--ft-paper)",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Background halftone */}
          <div aria-hidden="true" style={{
            position: "absolute", inset: 0, opacity: 0.12,
            backgroundImage: "radial-gradient(var(--ft-ink) 1.4px, transparent 1.6px)",
            backgroundSize: "14px 14px",
            maskImage: "linear-gradient(180deg, transparent 0%, #000 30%, #000 80%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 30%, #000 80%, transparent 100%)",
          }} />

          <div className="ft-wrap-wide" style={{ position: "relative", padding: "40px 24px 56px", display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 56, alignItems: "center" }}>
            <div style={{ position: "relative", minWidth: 0 }}>
              <span className="ft-pill is-yellow" style={{ marginBottom: 18 }}>
                PORTADA · EDICIÓN ESPECIAL
              </span>

              <h1 className="ft-display" style={{
                fontSize: "clamp(48px, 8vw, 120px)",
                margin: "12px 0",
                letterSpacing: "0.005em",
                lineHeight: 0.86,
                color: "var(--ft-ink)",
                textShadow: "6px 6px 0 var(--ft-pink)",
                wordBreak: "break-word",
              }}>
                {featured ? featured.title : "FURRET TODAY"}
              </h1>

              <p className="ft-deck" style={{
                margin: "16px 0 24px",
                fontSize: "clamp(18px, 2vw, 26px)",
                maxWidth: 640,
                color: "#262030",
              }}>
                {featured ? featured.subtitle || "Las noticias más POP de la comunidad Pokémon" : "El semanario pop de la comunidad Pokémon hispanohablante."}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <InternalLink
                  href={featured ? `furrettoday/leer/${featured.id}` : "#"}
                  className="ft-btn is-primary is-lg"
                >
                  {featured ? "LEER LA PORTADA →" : "EXPLORAR"}
                </InternalLink>
                <span className="ft-meta">Redacción Furret Today</span>
              </div>
            </div>

            {/* Cover illustration area */}
            <div style={{ position: "relative", minHeight: 400, minWidth: 0, overflow: "visible" }}>
              {/* Big yellow circle */}
              <div style={{
                position: "absolute", right: "8%", top: "10%",
                width: 300, height: 300, borderRadius: 999,
                background: "var(--ft-yellow)",
                border: "var(--ft-border-thick)",
                boxShadow: "var(--ft-shadow-pop-lg)",
              }} />
              {/* Halftone band */}
              <div aria-hidden="true" style={{
                position: "absolute", right: "-4%", top: "32%",
                width: 400, height: 180,
                backgroundImage: "radial-gradient(var(--ft-ink) 2px, transparent 2.4px)",
                backgroundSize: "14px 14px",
                transform: "rotate(-8deg)",
                opacity: 0.85,
                maskImage: "linear-gradient(90deg, transparent 0%, #000 30%, #000 70%, transparent 100%)",
              }} />
              {/* Furret mascot */}
              <div style={{
                position: "absolute", left: "5%", bottom: "0%",
                transform: "rotate(-6deg)",
                filter: "drop-shadow(8px 8px 0 var(--ft-ink))",
              }}>
                <Image
                  src="/smartrotom/img/apps/furrettoday/furret2.png"
                  alt="Furret mascot"
                  width={340}
                  height={340}
                  className="object-contain"
                />
              </div>
              {/* Sticker */}
              <div className="ft-sticker ft-bob" style={{
                position: "absolute", right: 36, top: 36, fontSize: 22, padding: "10px 18px",
                background: "var(--ft-pink)", color: "#fff",
              }}>
                ¡EXCLUSIVA!
              </div>
            </div>
          </div>
        </section>

        {/* Ticker */}
        <Ticker items={tickerItems} />

        {/* Top featured section */}
        <section className="ft-wrap-wide" style={{ padding: "56px 24px 24px" }}>
          <SectionHeader
            eyebrow="LO MÁS LEÍDO ESTA SEMANA"
            title="Las Noticias en Boca de Todos"
            number="01"
          />
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr",
            gap: 24,
            marginTop: 32,
          }}>
            <div style={{ gridColumn: "span 1" }}>
              <MainCard news={featured ?? undefined} />
            </div>
            <div>
              {published && published[0] ? (
                <CardComponent variant="pink" news={published[0]} />
              ) : (
                <div className="ft-card" style={{ padding: 24, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="ft-meta">Próximamente</span>
                </div>
              )}
            </div>
            <div>
              {published && published[1] ? (
                <CardComponent variant="purple" news={published[1]} />
              ) : (
                <div className="ft-card" style={{ padding: 24, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="ft-meta">Próximamente</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Subscribe strip */}
        <SubscribeStrip />

        {/* More articles grid */}
        {published && published.length > 2 && (
          <section className="ft-wrap-wide" style={{ padding: "24px 24px 56px" }}>
            <SectionHeader
              eyebrow="REPORTAJES · COMUNIDAD · GUÍAS"
              title="Más Páginas Que Pasar"
              number="02"
            />
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0,1fr))",
              gap: 24,
              marginTop: 32,
            }}>
              {published.slice(2).map((item, index) => {
                const variants = ["cyan", "orange", "lime", "yellow", "pink", "purple"];
                return (
                  <CardComponent
                    key={item.id}
                    variant={variants[index % variants.length]}
                    news={item}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Collector strip */}
        <CollectorStrip />

        <FurretFooter categories={footerCategories} />
      </div>
      <PopStyles />
    </div>
  );
}
