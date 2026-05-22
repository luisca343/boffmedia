"use client";

import React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { InternalLink } from "@/components/ui/navigation/Link";
import FurretHeader from "../../_components/Header";
import FurretFooter from "../../_components/Footer";
import { useGetNewsById } from "@/hooks/documents/useGetNewsById";
import PopArtWallpaper from "../../_components/PopArtWallpaper";
import PopStyles from "../../_components/PopStyles";
import { useGetAllNews } from "@/hooks/documents/useGetAllNews";

const CustomEditor = dynamic(() => import("@/components/shared/ckeditor/TestEditor"), {
  ssr: false,
});

export default function ReadPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = React.use(params as any) as { id: string };
  const { article, error, isLoading } = useGetNewsById(id);
  const { published } = useGetAllNews();

  /* ---------- Loading state ---------- */
  if (isLoading) {
    return (
      <div className="ft-root" style={{ position: "relative" }}>
        <PopArtWallpaper />
        <div style={{ position: "relative", zIndex: 1 }}>
          <FurretHeader />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: 48 }}>
            <div className="ft-card" style={{ padding: 48, textAlign: "center", background: "var(--ft-yellow)", maxWidth: 480 }}>
              <div className="ft-display" style={{ fontSize: 44, color: "var(--ft-pink)" }}>¡CARGANDO!</div>
              <p className="ft-body" style={{ margin: "12px 0" }}>Furret está preparando tu noticia...</p>
              <div className="ft-skel" style={{ height: 12, marginTop: 16 }} />
            </div>
          </div>
        </div>
        <PopStyles />
      </div>
    );
  }

  /* ---------- Error state ---------- */
  if (error || !article) {
    return (
      <div className="ft-root" style={{ position: "relative" }}>
        <PopArtWallpaper />
        <div style={{ position: "relative", zIndex: 1 }}>
          <FurretHeader />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: 48 }}>
            <div className="ft-card" style={{ padding: 48, textAlign: "center", background: "var(--ft-yellow-soft)", maxWidth: 520 }}>
              <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto 16px" }}>
                <Image src="/smartrotom/img/apps/furrettoday/furret2.png" alt="Furret confundido" fill className="object-contain" />
              </div>
              <div className="ft-display" style={{ fontSize: 44, color: "var(--ft-pink)" }}>¡OOPS!</div>
              <p className="ft-deck" style={{ fontSize: 20, margin: "12px 0 24px" }}>No se pudo cargar la noticia. Quizás Furret se la comió.</p>
              <InternalLink href="/smartrotom/furrettoday" className="ft-btn is-primary">VOLVER A PORTADA</InternalLink>
            </div>
          </div>
        </div>
        <PopStyles />
      </div>
    );
  }

  /* ---------- Article content ---------- */
  const articleContent = article!.content.replace(/<h1>.*?<\/h1>/, "<h1></h1>");
  const related = (published || []).filter(n => n.id !== article!.id).slice(0, 3);

  return (
    <div className="ft-root" style={{ position: "relative" }}>
      <PopArtWallpaper />
      <div style={{ position: "relative", zIndex: 1 }}>
        <FurretHeader />

        {/* Breadcrumb / utility row */}
        <div style={{ background: "var(--ft-paper-2)" }}>
          <div className="ft-wrap-wide" style={{ padding: "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
            <InternalLink href="/smartrotom/furrettoday" className="ft-btn is-sm is-ghost">
              ← Portada
            </InternalLink>
            <span className="ft-meta">/</span>
            <span className="ft-meta">ARTÍCULO</span>
          </div>
        </div>

        {/* Title block */}
        <header style={{ position: "relative", background: "var(--ft-paper)", overflow: "hidden" }}>
          <div aria-hidden="true" style={{
            position: "absolute", inset: 0, opacity: 0.10,
            backgroundImage: "radial-gradient(var(--ft-ink) 1.4px, transparent 1.6px)",
            backgroundSize: "14px 14px",
          }} />
          <div className="ft-wrap" style={{ position: "relative", padding: "48px 24px 32px", maxWidth: 880, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span className="ft-pill is-pink">ARTÍCULO</span>
              <span className="ft-meta">Furret Today</span>
            </div>
            <h1 className="ft-display" style={{
              fontSize: "clamp(40px, 7vw, 88px)", lineHeight: 0.96, margin: "0 0 18px",
              textShadow: "5px 5px 0 var(--ft-pink)",
            }}>
              {article.title}
            </h1>
            {article.subtitle && (
              <p className="ft-deck" style={{ fontSize: "clamp(18px, 2.2vw, 24px)", marginTop: 0, color: "#262030", maxWidth: 760 }}>
                {article.subtitle}
              </p>
            )}

            {/* Byline row */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 22 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 999, background: "var(--ft-cyan)",
                border: "var(--ft-border)", display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--ft-font-display)", fontSize: 30, color: "var(--ft-ink)",
              }}>{((article as any).author || "F")[0].toUpperCase()}</div>
              <div>
                <div className="ft-byline" style={{ fontSize: 18 }}>{(article as any).author || "Redacción Furret Today"}</div>
                <div className="ft-meta">{(article as any).readtime || "Semanario Pop"}</div>
              </div>
              {(article as any).category && (
                <span className="ft-chip" style={{ marginLeft: "auto" }}>{(article as any).category}</span>
              )}
            </div>
          </div>
        </header>

        {/* Hero image strip */}
        {article.imageUrl && (
          <div style={{ background: "var(--ft-paper)", padding: "24px" }}>
            <div className="ft-wrap-wide" style={{ position: "relative" }}>
              <div className="ft-card-flat" style={{ overflow: "hidden", border: "var(--ft-border-thick)", boxShadow: "var(--ft-shadow-pop-lg)" }}>
                <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", maxHeight: "70vh" }}>
                  <Image src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="(max-width: 1200px) 100vw, 1200px" />
                </div>
              </div>
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between" }}>
                <span className="ft-meta">Ilustración · Estudio POP de Furret Today</span>
                <span className="ft-meta">Fig. 01</span>
              </div>
            </div>
          </div>
        )}

        {/* Body + sidebar */}
        <main style={{ padding: "16px 24px 48px", background: "var(--ft-paper-2)" }}>
          <div className="ft-wrap-wide" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: 48, alignItems: "flex-start" }}>
            {/* Article body */}
            <article>
              <div style={{ overflow: "hidden", marginBottom: 32, background: "#fff", borderRadius: "var(--ft-radius)" }}>
                <div style={{ position: "relative", minHeight: 400, background: "var(--ft-paper-2)" }}>
                  <CustomEditor
                    document={{ ...article!, content: articleContent }}
                    documentId={id}
                    documentType={1}
                    readonly={true}
                  />
                </div>
              </div>

              {/* Article footer CTA */}
              <div style={{ padding: 24, background: "var(--ft-yellow-soft)", borderRadius: "var(--ft-radius-lg)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
                    <Image src="/smartrotom/img/apps/furrettoday/furret2.png" alt="Furret" fill className="object-contain" />
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div className="ft-display" style={{ fontSize: 28, lineHeight: 0.95 }}>¿Te gustó el reportaje?</div>
                    <p className="ft-body" style={{ margin: "4px 0 0" }}>
                      Vuelve a la portada para leer más noticias de Furret Today.
                    </p>
                  </div>
                  <InternalLink href="/smartrotom/furrettoday" className="ft-btn is-primary">
                    VOLVER A PORTADA
                  </InternalLink>
                </div>
              </div>
            </article>

            {/* Sidebar */}
            <aside style={{ position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Share */}
              <div className="ft-card-flat" style={{ padding: 16 }}>
                <div className="ft-eyebrow" style={{ color: "var(--ft-pink)", marginBottom: 8 }}>COMPARTIR</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                  <button className="ft-btn is-sm">Discord</button>
                  <button className="ft-btn is-sm is-cyan">Twitter</button>
                </div>
              </div>

              {/* Related articles */}
              {related.length > 0 && (
                <div className="ft-card-flat" style={{ padding: 16 }}>
                  <div className="ft-eyebrow" style={{ color: "var(--ft-pink)", marginBottom: 12 }}>SEGUIR LEYENDO</div>
                  <div style={{ display: "grid", gap: 12 }}>
                    {related.map((a, i) => (
                      <Link key={a.id} href={`/smartrotom/furrettoday/leer/${a.id}`} style={{
                        display: "grid", gridTemplateColumns: "40px 1fr", gap: 10, padding: 8, alignItems: "center",
                        borderRadius: 12,
                      }}>
                        <div className="ft-stamp" style={{ fontSize: 38, color: ["var(--ft-pink)", "var(--ft-cyan)", "var(--ft-purple)"][i % 3] }}>
                          {String(i + 1).padStart(2, "0")}
                        </div>
                        <div>
                          <div className="ft-display" style={{ fontSize: 16, lineHeight: 1.05 }}>{a.title}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </main>

        <FurretFooter />
      </div>
      <PopStyles />
      <style jsx global>{`
        .ck-placeholder { display: none !important; }
      `}</style>
    </div>
  );
}
