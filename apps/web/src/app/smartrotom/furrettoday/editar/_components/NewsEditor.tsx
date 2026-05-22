'use client'

import React, { useState, Suspense } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/primitives/dialog'
import { useNews } from '../_hooks/useNews'
import FurretHeader from '../../_components/Header'
import FurretFooter from '../../_components/Footer'
import PopArtWallpaper from '../../_components/PopArtWallpaper'
import { InternalLink } from "@/components/ui/navigation/Link"
import { sendToast } from '@/lib/toast'
import { useBoffSession } from '@/services/useBoffSession'
import { USER_ROLES } from '@boffmedia/shared/roles'
import Image from 'next/image'

const NewsList = React.lazy(() => import('./NewsList'))
const NewsContent = React.lazy(() => import('./NewsContent'))
const NewsManager = React.lazy(() => import('../../_components/NewsManager'))
const PopStyles = React.lazy(() => import('../../_components/PopStyles'))

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div style={{
      background: `var(--ft-${tone})`,
      color: tone === "yellow" || tone === "lime" || tone === "cyan" ? "var(--ft-ink)" : "#fff",
      border: "var(--ft-border)", borderRadius: 14, padding: "8px 14px", minWidth: 72, textAlign: "center",
      boxShadow: "var(--ft-shadow-pop-sm)",
    }}>
      <div className="ft-display" style={{ fontSize: 32, lineHeight: 1 }}>{value}</div>
      <div className="ft-eyebrow" style={{ fontSize: 10, marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function NewsEditor() {
  const { session, hasRole, status } = useBoffSession()
  const token = session?.user?.accessToken ?? ''
  const canManageNews = hasRole([USER_ROLES.ROTOM_ADMIN, USER_ROLES.ROTOM_FURRET])

  const {
    news,
    setNews,
    fetchNews,
    publishedNewsIds,
    featuredNewsId,
    handleSave,
    hasUnsavedChanges,
    handlePublishToggle,
    handleFeaturedToggle,
    isLoading
  } = useNews()
  const [selectedNewsId, setSelectedNewsId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  if (status === 'loading') {
    return (
      <div className="ft-root" style={{ position: "relative" }}>
        <PopArtWallpaper />
        <div style={{ position: "relative", zIndex: 1 }}>
          <FurretHeader />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: 48 }}>
            <div className="ft-card" style={{ padding: 48, textAlign: "center", background: "var(--ft-yellow)", maxWidth: 480 }}>
              <div className="ft-display" style={{ fontSize: 44, color: "var(--ft-pink)" }}>¡CARGANDO!</div>
              <p className="ft-body" style={{ margin: "12px 0" }}>Verificando permisos...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!canManageNews) {
    return (
      <div className="ft-root" style={{ position: "relative" }}>
        <PopArtWallpaper />
        <div style={{ position: "relative", zIndex: 1 }}>
          <FurretHeader />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: 48 }}>
            <div className="ft-card" style={{ padding: 48, textAlign: "center", background: "var(--ft-pink-soft)", maxWidth: 520 }}>
              <div className="ft-display" style={{ fontSize: 44, color: "var(--ft-pink)" }}>ACCESO DENEGADO</div>
              <p className="ft-body" style={{ margin: "12px 0 24px" }}>Necesitas el rol ROTOM_ADMIN o ROTOM_FURRET para editar noticias.</p>
              <InternalLink href="/smartrotom/furrettoday" className="ft-btn is-primary">VOLVER A PORTADA</InternalLink>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function updateNews(id: number, content: string) {
    const newNews = news.map(item => ({ ...item }))
    const itemToUpdate = newNews.find(item => item.id === id)

    if (itemToUpdate) {
      itemToUpdate.content = content
      const featuredNews = newNews.find(item => item.id === featuredNewsId)
      const otherNews = newNews.filter(item => item.id !== featuredNewsId)
      setNews({ featured: featuredNews!, news: otherNews })
      sendToast(`Cambios guardados en ${itemToUpdate.title}`)
    }
  }

  function handleNewsSaved() {
    fetchNews()
    setIsDialogOpen(false)
  }

  const total = news.length
  const published = publishedNewsIds.length
  const featured = featuredNewsId ? 1 : 0
  const drafts = total - published

  return (
    <div className="ft-root" style={{ position: "relative" }}>
      <PopArtWallpaper />
      <div style={{ position: "relative", zIndex: 1 }}>
        <FurretHeader />

        {/* Editor utility bar */}
        <div style={{ background: "var(--ft-paper-2)", borderBottom: "1.5px dashed var(--ft-ink)" }}>
          <div className="ft-wrap-wide" style={{ padding: "12px 24px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <InternalLink href="/smartrotom/furrettoday" className="ft-btn is-sm is-ghost">← Portada</InternalLink>
            <span className="ft-meta">/</span>
            <span className="ft-meta" style={{ fontWeight: 800, color: "var(--ft-pink)" }}>REDACCIÓN · EDITOR</span>
            {hasUnsavedChanges && (
              <span className="ft-pill is-yellow" style={{ marginLeft: 6 }}>● Cambios sin guardar</span>
            )}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button
                className={`ft-btn is-sm ${hasUnsavedChanges ? 'is-primary' : ''}`}
                onClick={() => handleSave(token)}
                disabled={!hasUnsavedChanges}
                style={!hasUnsavedChanges ? { opacity: 0.55, cursor: 'not-allowed' } : {}}
              >
                💾 Guardar cambios
              </button>
            </div>
          </div>
        </div>

        {/* Header strip */}
        <section style={{ position: "relative", borderBottom: "var(--ft-border)", background: "var(--ft-paper-dark)", color: "#fff", overflow: "hidden" }}>
          <div aria-hidden="true" style={{
            position: "absolute", inset: 0, opacity: 0.18,
            backgroundImage: "radial-gradient(#fff 1.4px, transparent 1.6px)",
            backgroundSize: "14px 14px",
          }} />
          <div className="ft-wrap-wide" style={{ position: "relative", padding: "36px 24px 28px", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "end", gap: 24 }}>
            <div>
              <div className="ft-eyebrow" style={{ color: "var(--ft-yellow)" }}>SALA DE REDACCIÓN</div>
              <h1 className="ft-display" style={{
                margin: "6px 0 0", fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 0.95, color: "var(--ft-yellow)",
                textShadow: "5px 5px 0 var(--ft-pink)",
              }}>
                Editor de Noticias
              </h1>
              <p className="ft-deck" style={{ margin: "12px 0 0", color: "rgba(255,255,255,0.85)", fontSize: 18, maxWidth: 600 }}>
                Escribe, publica y destaca. La portada se decide aquí.
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Stat label="TOTAL" value={total} tone="cyan" />
              <Stat label="PUBLIC." value={published} tone="lime" />
              <Stat label="DESTAC." value={featured} tone="pink" />
              <Stat label="BORRAD." value={drafts} tone="yellow" />
            </div>
          </div>
        </section>

        {/* Editor split */}
        <main className="ft-wrap-wide" style={{ padding: "24px 24px 48px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "360px minmax(0, 1fr)", gap: 24, alignItems: "flex-start" }}>
            {/* Sidebar */}
            <aside className="ft-card-flat" style={{ background: "#fff", padding: 0, position: "sticky", top: 24, maxHeight: "calc(100vh - 60px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Header */}
              <div style={{ padding: 16, borderBottom: "var(--ft-border)", background: "var(--ft-pink)", color: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span className="ft-eyebrow" style={{ color: "var(--ft-yellow)" }}>LISTA DE NOTICIAS</span>
                  <span className="ft-meta" style={{ color: "#fff", opacity: 0.85 }}>{total}</span>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="ft-btn is-lg is-ink" style={{ width: "100%", justifyContent: "center" }}>
                      + Nueva noticia
                    </button>
                  </DialogTrigger>
                  <DialogContent className="w-[min(92vw,48rem)] max-w-3xl border-4 border-black bg-[#fff7d6] p-0 overflow-hidden">
                    <DialogHeader className="sr-only">
                      <DialogTitle>Crear nueva noticia</DialogTitle>
                    </DialogHeader>
                    <Suspense fallback={<div style={{ padding: 24, textAlign: "center" }} className="ft-body">Cargando editor...</div>}>
                      <NewsManager onClose={() => setIsDialogOpen(false)} onSaved={handleNewsSaved} />
                    </Suspense>
                  </DialogContent>
                </Dialog>
              </div>

              {/* News list */}
              <div className="ft-scroll" style={{ display: "flex", flexDirection: "column", flexGrow: 1, minHeight: 0 }}>
                <Suspense fallback={<div style={{ padding: 24, textAlign: "center" }} className="ft-meta">Cargando...</div>}>
                  {isLoading ? (
                    <div style={{ padding: 24, textAlign: "center" }} className="ft-meta">Cargando noticias...</div>
                  ) : (
                    <NewsList
                      news={news}
                      publishedNewsIds={publishedNewsIds}
                      featuredNewsId={featuredNewsId}
                      selectedNewsId={selectedNewsId}
                      setSelectedNewsId={setSelectedNewsId}
                      handlePublishToggle={handlePublishToggle}
                      handleFeaturedToggle={handleFeaturedToggle}
                    />
                  )}
                </Suspense>
              </div>
            </aside>

            {/* Content area */}
            <Suspense fallback={<div className="ft-card" style={{ padding: 48, textAlign: "center" }}><div className="ft-display" style={{ fontSize: 32 }}>Cargando editor...</div></div>}>
              <NewsContent
                selectedNewsId={selectedNewsId}
                news={news}
                updateNews={updateNews}
                refreshNews={fetchNews}
              />
            </Suspense>
          </div>
        </main>

        <FurretFooter />
      </div>
      <Suspense fallback={null}>
        <PopStyles />
      </Suspense>
    </div>
  )
}
