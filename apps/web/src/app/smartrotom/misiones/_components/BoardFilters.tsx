"use client"

import React from "react"
import { QuestStatus } from "@/types/misiones"
import { Icon, STATUS_LABEL } from "./misiones-atoms"

export interface BoardFiltersProps {
  search: string
  setSearch: (v: string) => void
  statusFilter: string
  setStatusFilter: (v: string) => void
  sort: string
  setSort: (v: string) => void
  counts: Record<string, number>
}

export function BoardFilters({ search, setSearch, statusFilter, setStatusFilter, sort, setSort, counts }: BoardFiltersProps) {
  const statuses = ["ALL", QuestStatus.ACTIVE, QuestStatus.AVAILABLE, QuestStatus.COMPLETED, QuestStatus.FAILED, QuestStatus.LOCKED]
  return (
    <div style={{
      padding: "12px 16px",
      background: "linear-gradient(180deg, rgba(60,40,20,0.55), rgba(40,24,12,0.65))",
      border: "1px solid rgba(0,0,0,0.4)",
      borderRadius: 4,
      boxShadow: "inset 0 1px 0 rgba(255,200,100,0.1)",
      display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center",
      marginBottom: 24,
    }}>
      <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 320 }}>
        <input
          className="field"
          type="text"
          placeholder="Buscar misión, NPC, lugar…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 34 }}
        />
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)" }}>
          <Icon.Search size={14}/>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {statuses.map((s) => (
          <button key={s} className={`chip ${statusFilter === s ? "active" : ""}`} onClick={() => setStatusFilter(s)}>
            {s === "ALL" ? "Todas" : STATUS_LABEL[s as QuestStatus]}
            <span style={{ opacity: 0.65 }}>({counts[s] || 0})</span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }}/>

      <select value={sort} onChange={(e) => setSort(e.target.value)} className="field" style={{
        width: "auto", padding: "9px 12px", fontFamily: "var(--font-uppercase)", fontSize: 11, letterSpacing: "0.10em",
      }}>
        <option value="status">Orden: por sello</option>
        <option value="name">Orden: alfabético</option>
        <option value="type">Orden: por tipo</option>
      </select>
    </div>
  )
}
