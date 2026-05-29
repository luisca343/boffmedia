"use client"

import React, { useState } from "react"

export interface RewardRarity {
  label: string
  key: string
  color: string
  glow: string
  ring: string
  stars: number
}

const RARITY: Record<string, RewardRarity> = {
  common:    { label: "Común",      key: "common",    color: "var(--ink-3)",  glow: "rgba(120,90,55,0.0)",   ring: "rgba(60,40,20,0.45)", stars: 1 },
  rare:      { label: "Raro",       key: "rare",      color: "#2f6f8e",       glow: "rgba(70,150,200,0.55)", ring: "#2f6f8e",             stars: 2 },
  epic:      { label: "Épico",      key: "epic",      color: "#7a3f9e",       glow: "rgba(160,90,210,0.6)",  ring: "#7a3f9e",             stars: 3 },
  legendary: { label: "Legendario", key: "legendary", color: "#b9821a",       glow: "rgba(235,185,55,0.7)",  ring: "#d6a13f",             stars: 4 },
}

const RARITY_FLAVOR: Record<string, string> = {
  common:    "Objeto de uso corriente. Útil, abundante, sin misterio.",
  rare:      "No se encuentra cada día. Guárdalo con cuidado.",
  epic:      "Forjado por manos expertas. Pocos llegan a poseerlo.",
  legendary: "Reliquia de leyenda. Su brillo no se apaga jamás.",
}

export function rarityOf(key: string): RewardRarity {
  return RARITY[key] || RARITY.common
}

export function RarityStars({ rarity, size = 9 }: { rarity: string; size?: number }) {
  const r = rarityOf(rarity)
  return (
    <span style={{ display: "inline-flex", gap: 1, color: r.color, fontSize: size, lineHeight: 1 }}>
      {Array.from({ length: r.stars }).map((_, i) => <span key={i}>★</span>)}
    </span>
  )
}

export interface RewardCardProps {
  name: string
  icon: string
  rarity: string
}

export function RewardCard({ name, icon, rarity }: RewardCardProps) {
  const [hover, setHover] = useState(false)
  const r = rarityOf(rarity)
  const fancy = rarity === "epic" || rarity === "legendary"
  return (
    <div
      className={`reward-card rarity-${r.key}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 12, borderRadius: 2,
        background: "rgba(255,240,200,0.45)",
        border: `1px solid ${r.ring}`,
        boxShadow: fancy ? `0 0 0 1px ${r.ring}, 0 0 16px -2px ${r.glow}` : "none",
        display: "flex", gap: 12, alignItems: "center",
        cursor: "default",
      }}
    >
      {fancy && <span className="reward-shimmer" aria-hidden="true"/>}
      <div style={{
        width: 42, height: 42, borderRadius: 2, flexShrink: 0,
        background: "linear-gradient(135deg, var(--gold-1), var(--gold-2))",
        border: `1.5px solid ${r.ring}`,
        boxShadow: fancy ? `0 0 10px -1px ${r.glow}` : "none",
        display: "grid", placeItems: "center",
        fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink-1)",
        position: "relative", zIndex: 1,
      }}>{icon}</div>
      <div style={{ minWidth: 0, flex: 1, position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 13, color: "var(--ink-1)", fontWeight: 600, lineHeight: 1.2 }}>{name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
          <RarityStars rarity={rarity}/>
          <span style={{ fontSize: 9, color: r.color, fontFamily: "var(--font-uppercase)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            {r.label}
          </span>
        </div>
      </div>
      {hover && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
          transform: "translateX(-50%)", width: 190, zIndex: 60,
          padding: "10px 12px", pointerEvents: "none",
          background: "linear-gradient(180deg, var(--paper-1), var(--paper-3))",
          border: `1px solid ${r.ring}`,
          boxShadow: `0 8px 22px rgba(0,0,0,0.5), 0 0 14px -2px ${r.glow}`,
          borderRadius: 2,
        }}>
          <div className="dec-title" style={{ fontSize: 14, color: "var(--ink-1)", marginBottom: 2 }}>{name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <RarityStars rarity={rarity} size={11}/>
            <span style={{ fontSize: 10, color: r.color, fontFamily: "var(--font-uppercase)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{r.label}</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-2)", fontStyle: "italic", lineHeight: 1.45 }}>
            {RARITY_FLAVOR[rarity] || RARITY_FLAVOR.common}
          </div>
          <div style={{
            position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%) rotate(45deg)",
            width: 10, height: 10, background: "var(--paper-3)", borderRight: `1px solid ${r.ring}`, borderBottom: `1px solid ${r.ring}`,
          }}/>
        </div>
      )}
    </div>
  )
}
