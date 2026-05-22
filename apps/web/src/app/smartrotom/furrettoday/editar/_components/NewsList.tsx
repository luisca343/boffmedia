import React, { useState, useEffect } from 'react'

interface NewsItem {
  id: number
  title: string
}

interface NewsListProps {
  news: NewsItem[]
  publishedNewsIds: number[]
  featuredNewsId: number | null
  selectedNewsId: number | null
  setSelectedNewsId: (id: number) => void
  handlePublishToggle: (id: number) => void
  handleFeaturedToggle: (id: number) => void
}

function Toggle({ checked, label, tone, onChange }: { checked: boolean; label: string; tone: string; onChange: () => void }) {
  return (
    <label style={{
      display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
      padding: "5px 10px",
      background: checked ? `var(--ft-${tone})` : "#fff",
      color: checked && tone !== "yellow" && tone !== "cyan" && tone !== "lime" ? "#fff" : "var(--ft-ink)",
      border: "1.5px solid var(--ft-ink)",
      borderRadius: 999,
      fontFamily: "var(--ft-font-ui)", fontSize: 11, fontWeight: 700,
      letterSpacing: "0.05em", textTransform: "uppercase",
    }}>
      <span style={{
        width: 12, height: 12, borderRadius: 4,
        background: checked ? "var(--ft-ink)" : "transparent",
        border: "1.5px solid var(--ft-ink)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        color: checked ? "var(--ft-yellow)" : "transparent", fontSize: 10, fontWeight: 900, lineHeight: 1,
      }}>{checked ? "✓" : ""}</span>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />
      {label}
    </label>
  )
}

export default function NewsList({
  news,
  publishedNewsIds,
  featuredNewsId,
  selectedNewsId,
  setSelectedNewsId,
  handlePublishToggle,
  handleFeaturedToggle,
}: NewsListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredNews, setFilteredNews] = useState(news)

  useEffect(() => {
    setFilteredNews(
      news.filter((item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [news, searchTerm])

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Search */}
      <div style={{ padding: 14, borderBottom: "1.5px dashed var(--ft-ink)" }}>
        <input
          className="ft-input"
          placeholder="Buscar por título..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      {/* List */}
      <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", flexGrow: 1 }}>
        {filteredNews.length > 0 ? (
          filteredNews.map((item) => {
            const isPublished = publishedNewsIds.includes(item.id)
            const isFeatured = item.id === featuredNewsId
            const isSelected = item.id === selectedNewsId
            const status = isFeatured
              ? { label: "DESTACADA", tone: "pink" }
              : isPublished
                ? { label: "PUBLICADA", tone: "lime" }
                : { label: "BORRADOR", tone: "yellow" }

            return (
              <div
                key={item.id}
                onClick={() => setSelectedNewsId(item.id)}
                style={{
                  padding: 14, cursor: "pointer", borderRadius: 14,
                  border: isSelected ? "var(--ft-border-thick)" : "1.5px solid rgba(0,0,0,0.12)",
                  background: isSelected ? "var(--ft-yellow)" : "#fff",
                  boxShadow: isSelected ? "4px 4px 0 0 var(--ft-ink)" : "none",
                  transition: "transform 120ms ease",
                  transform: isSelected ? "translate(-1px, -1px)" : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span className={`ft-pill is-${status.tone}`} style={{ fontSize: 10 }}>{status.label}</span>
                </div>
                <h4 className="ft-display" style={{
                  margin: 0, fontSize: 18, lineHeight: 1.05,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>{item.title}</h4>

                {/* Action row */}
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
                  <Toggle
                    checked={isPublished || isFeatured}
                    label="Publicada"
                    tone="cyan"
                    onChange={() => handlePublishToggle(item.id)}
                  />
                  <Toggle
                    checked={isFeatured}
                    label="Destacada"
                    tone="pink"
                    onChange={() => handleFeaturedToggle(item.id)}
                  />
                </div>
              </div>
            )
          })
        ) : (
          <div style={{ padding: 24, textAlign: "center" }}>
            <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto" }}>
              <img src="/smartrotom/img/apps/furrettoday/furret2.png" alt="Furret" style={{ objectFit: "contain", width: "100%", height: "100%" }} />
            </div>
            <div className="ft-display" style={{ fontSize: 22, marginTop: 6 }}>NADA POR AQUÍ</div>
            <div className="ft-body" style={{ fontSize: 14 }}>Prueba a cambiar la búsqueda.</div>
          </div>
        )}
      </div>
    </div>
  )
}
