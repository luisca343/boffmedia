"use client"
import { useState } from 'react'
import CustomEditor from '@/components/shared/ckeditor/TestEditor'
import { useBoffSession } from '@/services/useBoffSession'
import { DocumentsService } from '@/services/api/smartrotom/documentsService'
import { CreateNewsDto } from '@boffmedia/shared'
import { sendToast } from '@/lib/toast'
import Image from 'next/image'

interface NewsContentProps {
  selectedNewsId: number | null
  news: any[]
  updateNews: (id: number, content: string) => void
}

function MetaField({ label, value, onChange, type = "input" }: { label: string; value: string; onChange: (v: string) => void; type?: "input" | "select" }) {
  return (
    <label style={{ display: "block" }}>
      <span className="ft-eyebrow" style={{ display: "block", marginBottom: 4, color: "var(--ft-pink)", fontSize: 10 }}>{label}</span>
      {type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%", border: "1.5px solid var(--ft-ink)", borderRadius: 10,
            padding: "8px 12px", fontFamily: "var(--ft-font-ui)", fontSize: 14,
            background: "#fff", outline: "none",
          }}
        >
          <option value="comunidad">Comunidad</option>
          <option value="meta">Meta · Competitivo</option>
          <option value="torneos">Torneos</option>
          <option value="filtraciones">Filtraciones</option>
          <option value="fanart">Fan Art</option>
          <option value="guias">Guías</option>
          <option value="entrevistas">Entrevistas</option>
        </select>
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%", border: "1.5px solid var(--ft-ink)", borderRadius: 10,
            padding: "8px 12px", fontFamily: "var(--ft-font-ui)", fontSize: 14,
            background: "#fff", outline: "none",
          }}
        />
      )}
    </label>
  )
}

export default function NewsContent({
  selectedNewsId,
  news,
  updateNews,
}: NewsContentProps) {
  const { session } = useBoffSession()
  const token = session?.user?.accessToken ?? ''
  const selectedNews = selectedNewsId !== null ? news.find((item) => item.id === selectedNewsId) : null
  const [savingMeta, setSavingMeta] = useState(false)

  if (!selectedNews) {
    return (
      <div className="ft-card" style={{ padding: 56, textAlign: "center", background: "var(--ft-yellow-soft)" }}>
        <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto" }}>
          <Image src="/smartrotom/img/apps/furrettoday/furret2.png" alt="Furret" fill className="object-contain" />
        </div>
        <h2 className="ft-display" style={{ fontSize: 44, margin: "12px 0 4px" }}>ELIGE UNA NOTICIA</h2>
        <p className="ft-deck" style={{ fontSize: 20, margin: "0 auto", maxWidth: 460 }}>
          Selecciona algo de la lista o crea un borrador para comenzar a editar.
        </p>
      </div>
    )
  }

  function handleMetaChange(field: string, value: string) {
    const updated = { ...selectedNews, [field]: value }
    // Optimistic local update via parent
    updateNews(selectedNews.id, selectedNews.content)
  }

  async function saveMeta() {
    setSavingMeta(true)
    try {
      await DocumentsService.updateActiveNews(selectedNews.id, {
        id: selectedNews.id,
        title: selectedNews.title,
        subtitle: selectedNews.subtitle,
        content: selectedNews.content,
        author: (selectedNews as any).author,
        category: (selectedNews as any).category,
        buttonText: selectedNews.buttonText,
        imageUrl: selectedNews.imageUrl,
      } as CreateNewsDto, token)
      sendToast('Metadatos guardados')
    } catch {
      sendToast('Error al guardar metadatos')
    } finally {
      setSavingMeta(false)
    }
  }

  return (
    <div className="ft-card-flat" style={{ padding: 0, overflow: "hidden", background: "#fff" }}>
      {/* Title row */}
      <div style={{ padding: 20, borderBottom: "1.5px dashed var(--ft-ink)", background: "var(--ft-paper-2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <div className="ft-eyebrow" style={{ color: "var(--ft-pink)" }}>EDITANDO · #{selectedNews.id}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <span className={`ft-pill ${selectedNews.featured ? "is-pink" : selectedNews.published ? "is-lime" : "is-yellow"}`}>
              {selectedNews.featured ? "DESTACADA" : selectedNews.published ? "PUBLICADA" : "BORRADOR"}
            </span>
          </div>
        </div>

        {/* Metadata fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 4 }}>
          <MetaField label="Autor/a" value={(selectedNews as any).author || ""} onChange={(v) => handleMetaChange("author", v)} />
          <MetaField label="Etiqueta" value={(selectedNews as any).category || "comunidad"} onChange={(v) => handleMetaChange("category", v)} type="select" />
          <MetaField label="Botón" value={selectedNews.buttonText || ""} onChange={(v) => handleMetaChange("buttonText", v)} />
        </div>
        <div style={{ marginTop: 10 }}>
          <MetaField label="URL imagen" value={selectedNews.imageUrl || ""} onChange={(v) => handleMetaChange("imageUrl", v)} />
        </div>
      </div>

      {/* Editor area */}
      <div style={{ minHeight: 460 }}>
        <CustomEditor
          document={selectedNews}
          documentId={selectedNewsId}
          documentType={1}
          updateNews={updateNews}
          token={token}
        />
      </div>

      {/* Footer status */}
      <div style={{ padding: "12px 20px", borderTop: "1.5px dashed var(--ft-ink)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "var(--ft-paper-2)" }}>
        <span className="ft-meta">CKEditor · estilo Furret</span>
        <button className="ft-btn is-sm" onClick={saveMeta} disabled={savingMeta}>
          {savingMeta ? 'Guardando...' : 'Guardar metadatos'}
        </button>
      </div>
    </div>
  )
}
