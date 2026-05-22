import React from "react";
import Image from "next/image";
import { InternalLink } from "@/components/ui/navigation/Link";
import { NewsItem } from "../page";
import { getPreview } from "../_util";

interface MainCardProps {
  news: NewsItem | undefined;
}

export default function MainCard({ news }: MainCardProps) {
  if (!news) {
    return (
      <div className="ft-card" style={{ overflow: "hidden", gridColumn: "span 2" }}>
        <div style={{ position: "relative", height: 320, borderBottom: "var(--ft-border)", background: "var(--ft-yellow)" }}>
          <div aria-hidden="true" style={{
            position: "absolute", inset: 0, opacity: 0.15,
            backgroundImage: "radial-gradient(var(--ft-ink) 1.4px, transparent 1.6px)",
            backgroundSize: "12px 12px",
          }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 200, height: 200 }}>
              <Image src="/smartrotom/img/apps/furrettoday/furret2.png" alt="Furret" fill className="object-contain" />
            </div>
          </div>
        </div>
        <div style={{ padding: "24px 26px" }}>
          <h2 className="ft-display" style={{ fontSize: 44, margin: "0 0 8px", color: "var(--ft-pink)" }}>¡OOPS!</h2>
          <p className="ft-deck" style={{ fontSize: 20, margin: 0 }}>Parece que Furret se ha comido la noticia principal.</p>
        </div>
      </div>
    );
  }

  const image = news.imageUrl || "/smartrotom/img/apps/furrettoday/default.webp";

  return (
    <article className="ft-card ft-lift" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Hero image */}
      <div style={{ position: "relative", height: 320, borderBottom: "var(--ft-border)" }}>
        <Image src={image} alt={news.title} fill className="object-cover" />
        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.5) 100%)",
        }} />
        {/* Badge */}
        <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: 8 }}>
          <span className="ft-pill is-pink">PORTADA</span>
        </div>
        {/* Comic burst accent */}
        <div style={{
          position: "absolute", bottom: 14, right: 14,
          background: "var(--ft-pink)", color: "#fff",
          fontFamily: "var(--ft-font-display)", fontSize: 22,
          padding: "8px 16px", borderRadius: 999,
          border: "var(--ft-border)", boxShadow: "var(--ft-shadow-pop-sm)",
          transform: "rotate(8deg)",
        }}>
          ¡HOT!
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 className="ft-display" style={{ margin: 0, fontSize: 44, lineHeight: 0.95 }}>
          {news.title}
        </h2>
        {news.subtitle && (
          <p className="ft-deck" style={{ margin: 0, fontSize: 20, color: "#3a3645" }}>
            {news.subtitle}
          </p>
        )}
        <div className="ft-body" style={{ margin: 0, color: "#3a3645" }}>
          {getPreview(news, 200)}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 4 }}>
          <span className="ft-meta">{news.author || "Redacción Furret Today"}{news.readtime ? ` · ${news.readtime}` : ""}</span>
          <InternalLink href={`furrettoday/leer/${news.id}`} className="ft-btn">
            {news.buttonText || "LEER LA PORTADA →"}
          </InternalLink>
        </div>
      </div>
    </article>
  );
}
