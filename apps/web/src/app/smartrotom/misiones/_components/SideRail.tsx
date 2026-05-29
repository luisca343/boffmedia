"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { Section } from "../_types/board"

export interface SideRailProps {
  section: Section
  setSection: (s: Section) => void
}

export function SideRail({ section, setSection }: SideRailProps) {
  const t = useTranslations("misiones")
  const items: { id: Section; label: string; glyph: string }[] = [
    { id: "board", label: t("nav_board"), glyph: "❦" },
    { id: "trama", label: t("nav_trama"), glyph: "✶" },
    { id: "atlas", label: t("nav_atlas"), glyph: "✦" },
    { id: "mochila", label: t("nav_mochila"), glyph: "◆" },
    { id: "trophy", label: t("nav_trophy"), glyph: "⚜" },
    { id: "journal", label: t("nav_journal"), glyph: "✥" },
  ]
  return (
    <aside className="wood-frame hide-mobile" style={{
      width: 'clamp(160px, 15vw, 240px)', flexShrink: 0,
      display: "flex", flexDirection: "column",
      borderRight: "3px solid #050201",
      position: "relative",
    }}>
      <div style={{ padding: "22px 16px 18px 16px", textAlign: "center", background: "linear-gradient(180deg, rgba(0,0,0,0.4), transparent)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--gold-2)", letterSpacing: "0.20em", fontFamily: "var(--font-uppercase)" }}>
          {t("sidenav_header")}
        </div>
        <h1 className="dec-title" style={{ margin: "8px 0 0 0", fontSize: 26, color: "var(--gold-1)", lineHeight: 1, textShadow: "0 2px 4px rgba(0,0,0,0.7)" }}>
          {t("sidenav_title")}
        </h1>
        <div style={{ marginTop: 8, fontSize: 10, color: "var(--gold-3)", letterSpacing: "0.16em", fontFamily: "var(--font-uppercase)", fontStyle: "italic", opacity: 0.8 }}>
          {t("sidenav_subtitle")}
        </div>
      </div>

      <div style={{ height: 2, marginInline: 14, background: "linear-gradient(90deg, transparent, var(--gold-3), transparent)", opacity: 0.5 }}/>

      <nav style={{ padding: "14px 0", flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map((it) => (
          <div key={it.id} className={`leather-tab ${section === it.id ? "active" : ""}`} onClick={() => setSection(it.id)}>
            <span style={{ fontSize: 16, opacity: 0.7 }}>{it.glyph}</span>
            <span style={{ flex: 1 }}>{it.label}</span>
          </div>
        ))}
      </nav>

      <div style={{ padding: "8px 14px 14px 14px", fontSize: 9, color: "rgba(217, 182, 115, 0.5)", fontFamily: "var(--font-uppercase)", letterSpacing: "0.16em", textAlign: "center" }}>
        {t("sidenav_footer")}
      </div>
    </aside>
  )
}
