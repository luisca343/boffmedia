"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { Section } from "../_types/board"

export interface MobileTopProps {
  section: Section
  setSection: (s: Section) => void
}

export function MobileTop({ section, setSection }: MobileTopProps) {
  const t = useTranslations("misiones")
  const items: { id: Section; label: string }[] = [
    { id: "board", label: t("mobile_nav_board") },
    { id: "atlas", label: t("mobile_nav_atlas") },
    { id: "trophy", label: t("mobile_nav_trophy") },
    { id: "journal", label: t("mobile_nav_journal") },
  ]
  return (
    <div className="wood-frame" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 12px", overflowX: "auto" }}>
      <span className="dec-title" style={{ color: "var(--gold-1)", fontSize: 16, flexShrink: 0, marginRight: 8 }}>{t("mobile_title")}</span>
      {items.map((it) => {
        const active = section === it.id
        return (
          <button key={it.id} onClick={() => setSection(it.id)} className="btn btn-sm" style={{
            background: active ? "linear-gradient(180deg, var(--gold-2), var(--gold-3))" : "transparent",
            color: active ? "#1e120a" : "var(--gold-1)",
            border: active ? "1px solid var(--gold-4)" : "1px solid rgba(255,200,100,0.3)",
            flexShrink: 0,
          }}>
            {it.label}
          </button>
        )
      })}
    </div>
  )
}
