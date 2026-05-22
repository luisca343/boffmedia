import React from "react";
import Image from "next/image";
import { InternalLink } from "@/components/ui/navigation/Link";
import { NewsItem } from "../page";
import { getPreview } from "../_util";

interface CardComponentProps {
  variant?: string;
  news: NewsItem;
}

const accentColors: Record<string, string> = {
  pink: "var(--ft-pink)",
  cyan: "var(--ft-cyan)",
  yellow: "var(--ft-yellow)",
  purple: "var(--ft-purple)",
  orange: "var(--ft-orange)",
  lime: "var(--ft-lime)",
  red: "var(--ft-red)",
  default: "var(--ft-yellow)",
};

const pillColors: Record<string, string> = {
  pink: "is-pink",
  cyan: "is-cyan",
  yellow: "is-yellow",
  purple: "is-purple",
  orange: "is-orange",
  lime: "is-lime",
  red: "is-pink",
  default: "is-yellow",
};

export default function CardComponent({ variant = "default", news }: CardComponentProps) {
  if (!news) {
    return (
      <div className="ft-card" style={{ padding: 24, textAlign: "center", background: "var(--ft-yellow-soft)" }}>
        <div className="ft-display" style={{ fontSize: 28, color: "var(--ft-pink)" }}>¡VACÍO!</div>
        <p className="ft-body" style={{ margin: "8px 0 0" }}>Furret está buscando más noticias...</p>
      </div>
    );
  }

  const accent = accentColors[variant] || accentColors.default;
  const pill = pillColors[variant] || pillColors.default;
  const hasImage = news.imageUrl && news.imageUrl !== "";

  return (
    <article className="ft-card ft-lift" style={{ overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Hero area */}
      <div style={{ position: "relative", height: 180, borderBottom: "var(--ft-border)", background: accent }}>
        {/* Halftone overlay */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, opacity: 0.15,
          backgroundImage: `radial-gradient(var(--ft-ink) 1.4px, transparent 1.6px)`,
          backgroundSize: "12px 12px",
        }} />
        {hasImage && (
          <Image
            src={news.imageUrl}
            alt={news.title}
            fill
            className="object-cover"
          />
        )}
        <span className={`ft-pill ${pill}`} style={{ position: "absolute", top: 12, left: 12 }}>
          {news.subtitle || "NOTICIA"}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10, flexGrow: 1 }}>
        <h3 className="ft-display" style={{ margin: 0, fontSize: 26, lineHeight: 1.0, letterSpacing: "0.02em" }}>
          {news.title}
        </h3>
        <div className="ft-body" style={{ margin: 0, fontSize: 14, color: "#3a3645", lineHeight: 1.5 }}>
          {getPreview(news, 120)}
        </div>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 8 }}>
          <span className="ft-meta">{news.author || "Redacción"}{news.readtime ? ` · ${news.readtime}` : ""}</span>
          <InternalLink
            href={`furrettoday/leer/${news.id}`}
            className="ft-btn is-sm"
          >
            LEER →
          </InternalLink>
        </div>
      </div>
    </article>
  );
}
