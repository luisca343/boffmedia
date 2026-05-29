"use client"

import React, { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { QuestData, QuestStatus } from "@/types/misiones"
import { Divider } from "../_ui/flourishes/Divider"
import { RarityStars, rarityOf } from "./RewardCard"

interface AggregatedReward {
  id: string
  name: string
  icon: string
  rarity: string
  qty: number
  owned: boolean
  sources: number
}

function parseQty(name: string): number {
  const m = String(name).match(/[×x]\s*(\d+)/)
  return m ? parseInt(m[1], 10) : 1
}

export interface InventoryScreenProps {
  quests: QuestData[]
}

export function InventoryScreen({ quests }: InventoryScreenProps) {
  const t = useTranslations("misiones")

  const ledger = useMemo(() => {
    const map = new Map<string, AggregatedReward>()
    for (const q of quests) {
      const owned = q.status === QuestStatus.COMPLETED
      for (const r of q.rewards || []) {
        const key = r.item
        const qty = parseQty(r.item) * (owned ? 1 : 0)
        if (!map.has(key)) map.set(key, { id: key, name: r.item, icon: "●", rarity: "common", qty: 0, owned: false, sources: 0 })
        const e = map.get(key)!
        e.qty += qty
        e.owned = e.owned || owned
        e.sources += 1
      }
    }
    return [...map.values()].sort((a, b) => rarityOf(b.rarity).stars - rarityOf(a.rarity).stars)
  }, [quests])

  const ownedItems = ledger.filter((i) => i.owned)
  const lockedItems = ledger.filter((i) => !i.owned)
  const byRarity = (key: string) => ledger.filter((i) => i.rarity === key)

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 24, marginTop: 10 }}>
        <span className="label" style={{ color: "var(--gold-1)" }}>{t("mochila_label")}</span>
        <h1 className="dec-title" style={{ fontSize: 38, color: "var(--paper-1)", margin: "4px 0 6px 0", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
          {t("mochila_title")}
        </h1>
        <div style={{ color: "var(--paper-3)", fontSize: 14, fontStyle: "italic" }}>
          {t("mochila_subtitle", { owned: ownedItems.length, locked: lockedItems.length })}
        </div>
        <div style={{ marginTop: 14, color: "var(--gold-2)", opacity: 0.7 }}><Divider color="var(--gold-2)" glyph="❖"/></div>
      </div>

      {/* Rarity tally */}
      <div className="paper" style={{ padding: "12px 16px", marginBottom: 22, display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center", transform: "rotate(-0.3deg)" }}>
        {["legendary", "epic", "rare", "common"].map((k) => {
          const r = rarityOf(k)
          const n = byRarity(k).filter((i) => i.owned).length
          const tot = byRarity(k).length
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <RarityStars rarity={k} size={11}/>
              <span style={{ fontFamily: "var(--font-uppercase)", fontSize: 11, letterSpacing: "0.10em", color: r.color }}>{r.label}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink-2)" }}>{n}/{tot}</span>
            </div>
          )
        })}
      </div>

      {/* Owned satchel grid */}
      <div className="label" style={{ marginBottom: 10, color: "var(--gold-1)" }}>{t("mochila_owned")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 12, marginBottom: 30 }}>
        {ownedItems.map((item) => <SatchelSlot key={item.id} item={item}/>)}
        {ownedItems.length === 0 && (
          <div style={{ gridColumn: "1 / -1", color: "var(--paper-3)", fontStyle: "italic", textAlign: "center", padding: 30 }}>
            {t("mochila_empty")}
          </div>
        )}
      </div>

      {/* Locked / to-earn */}
      <div className="label" style={{ marginBottom: 10, color: "var(--paper-3)" }}>{t("mochila_locked")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 12 }}>
        {lockedItems.map((item) => <SatchelSlot key={item.id} item={item} locked/>)}
      </div>
    </div>
  )
}

function SatchelSlot({ item, locked = false }: { item: AggregatedReward; locked?: boolean }) {
  const [hover, setHover] = useState(false)
  const r = rarityOf(item.rarity)
  const fancy = item.rarity === "epic" || item.rarity === "legendary"
  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      className={`satchel-slot rarity-${r.key}`}
      style={{
        position: "relative", aspectRatio: "1", borderRadius: 3,
        background: "radial-gradient(ellipse at 40% 30%, rgba(255,240,200,0.6), rgba(180,150,100,0.35))",
        border: `1.5px solid ${r.ring}`,
        boxShadow: fancy && !locked ? `inset 0 0 18px -4px ${r.glow}, 0 0 12px -3px ${r.glow}` : "inset 0 2px 8px rgba(60,40,20,0.3)",
        display: "grid", placeItems: "center", overflow: "hidden",
        filter: locked ? "grayscale(0.7) brightness(0.72)" : "none",
        cursor: "default",
      }}
    >
      {fancy && !locked && <span className="reward-shimmer" aria-hidden="true"/>}
      <div style={{ fontFamily: "var(--font-display)", fontSize: 34, color: "var(--ink-1)", position: "relative", zIndex: 1, lineHeight: 1 }}>
        {locked ? "?" : item.icon}
      </div>
      {!locked && item.qty > 1 && (
        <div style={{
          position: "absolute", bottom: 4, right: 5, zIndex: 2,
          fontFamily: "var(--font-mono)", fontSize: 11, color: "#1e120a", fontWeight: 700,
          background: "var(--gold-1)", border: "1px solid var(--gold-4)", borderRadius: 99,
          padding: "0 5px", lineHeight: 1.4,
        }}>×{item.qty}</div>
      )}
      <div style={{ position: "absolute", top: 4, left: 5, zIndex: 2 }}><RarityStars rarity={item.rarity} size={8}/></div>
      {hover && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
          width: 150, zIndex: 60, padding: "8px 10px", pointerEvents: "none",
          background: "linear-gradient(180deg, var(--paper-1), var(--paper-3))",
          border: `1px solid ${r.ring}`, borderRadius: 2, boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
          textAlign: "center",
        }}>
          <div className="dec-title" style={{ fontSize: 13, color: "var(--ink-1)" }}>{item.name}</div>
          <div style={{ fontSize: 9, color: r.color, fontFamily: "var(--font-uppercase)", letterSpacing: "0.12em", marginTop: 2 }}>
            {locked ? "Aún no obtenido" : r.label}
          </div>
        </div>
      )}
    </div>
  )
}
