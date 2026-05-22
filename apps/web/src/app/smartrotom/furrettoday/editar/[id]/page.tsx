'use client'

import dynamic from 'next/dynamic'
import { useGetNewsById } from '@/hooks/documents/useGetNewsById'
import { useBoffSession } from '@/services/useBoffSession'
import { USER_ROLES } from '@boffmedia/shared/roles'
import FurretHeader from '../../_components/Header'
import FurretFooter from '../../_components/Footer'
import PopArtWallpaper from '../../_components/PopArtWallpaper'
import PopStyles from '../../_components/PopStyles'
import { InternalLink } from "@/components/ui/navigation/Link"
import Image from 'next/image'

const CustomEditor = dynamic(() => import('@/components/shared/ckeditor/TestEditor'), { ssr: false })

export default function EditNote({ params }: { params: { id: string } }) {
  const { hasRole, status, session } = useBoffSession()
  const token = session?.user?.accessToken ?? ''
  const canManageNews = hasRole([USER_ROLES.ROTOM_ADMIN, USER_ROLES.ROTOM_FURRET])
  const { id } = params
  const { article, error, isLoading } = useGetNewsById(id)

  /* ---------- Loading ---------- */
  if (status === 'loading' || isLoading) {
    return (
      <div className="ft-root" style={{ position: "relative" }}>
        <PopArtWallpaper />
        <div style={{ position: "relative", zIndex: 1 }}>
          <FurretHeader />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: 48 }}>
            <div className="ft-card" style={{ padding: 48, textAlign: "center", background: "var(--ft-yellow)", maxWidth: 480 }}>
              <div className="ft-display" style={{ fontSize: 44, color: "var(--ft-pink)" }}>¡CARGANDO!</div>
              <p className="ft-body" style={{ margin: "12px 0" }}>Furret está preparando el editor...</p>
              <div className="ft-skel" style={{ height: 12, marginTop: 16 }} />
            </div>
          </div>
        </div>
        <PopStyles />
      </div>
    )
  }

  /* ---------- Access denied ---------- */
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
        <PopStyles />
      </div>
    )
  }

  /* ---------- Error / Not found ---------- */
  if (error || !article) {
    return (
      <div className="ft-root" style={{ position: "relative" }}>
        <PopArtWallpaper />
        <div style={{ position: "relative", zIndex: 1 }}>
          <FurretHeader />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: 48 }}>
            <div className="ft-card" style={{ padding: 48, textAlign: "center", background: "var(--ft-yellow-soft)", maxWidth: 520 }}>
              <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto 16px" }}>
                <Image src="/smartrotom/img/apps/furrettoday/furret2.png" alt="Furret" fill className="object-contain" />
              </div>
              <div className="ft-display" style={{ fontSize: 44, color: "var(--ft-pink)" }}>¡NO ENCONTRADO!</div>
              <p className="ft-deck" style={{ fontSize: 20, margin: "12px 0 24px" }}>El artículo no se pudo encontrar.</p>
              <InternalLink href="/smartrotom/furrettoday/editar" className="ft-btn is-primary">VOLVER AL EDITOR</InternalLink>
            </div>
          </div>
        </div>
        <PopStyles />
      </div>
    )
  }

  /* ---------- Editor ---------- */
  return (
    <div className="ft-root" style={{ position: "relative" }}>
      <PopArtWallpaper />
      <div style={{ position: "relative", zIndex: 1 }}>
        <FurretHeader />

        {/* Breadcrumb */}
        <div style={{ background: "var(--ft-paper-2)", borderBottom: "1.5px dashed var(--ft-ink)" }}>
          <div className="ft-wrap-wide" style={{ padding: "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
            <InternalLink href="/smartrotom/furrettoday" className="ft-btn is-sm is-ghost">← Portada</InternalLink>
            <span className="ft-meta">/</span>
            <InternalLink href="/smartrotom/furrettoday/editar" className="ft-btn is-sm is-ghost">Editor</InternalLink>
            <span className="ft-meta">/</span>
            <span className="ft-meta" style={{ fontWeight: 800, color: "var(--ft-pink)" }}>{article.title}</span>
          </div>
        </div>

        {/* Editor area */}
        <main style={{ padding: "24px 24px 48px" }}>
          <div className="ft-wrap-wide">
            <div className="ft-card-flat" style={{ padding: 0, overflow: "hidden", background: "#fff" }}>
              {/* Title row */}
              <div style={{ padding: 20, borderBottom: "1.5px dashed var(--ft-ink)", background: "var(--ft-paper-2)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div className="ft-eyebrow" style={{ color: "var(--ft-pink)" }}>EDITANDO · #{id}</div>
                  <span className="ft-meta">CKEditor · Furret Today</span>
                </div>
                <h2 className="ft-display" style={{ margin: "8px 0 0", fontSize: "clamp(28px, 3vw, 42px)", lineHeight: 1 }}>
                  {article.title}
                </h2>
              </div>

              {/* Editor */}
              <div style={{ minHeight: "60vh" }}>
                <CustomEditor
                  document={article}
                  documentId={id}
                  documentType={1}
                  type="news"
                  token={token}
                />
              </div>

              {/* Footer status */}
              <div style={{ padding: "12px 20px", borderTop: "1.5px dashed var(--ft-ink)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "var(--ft-paper-2)" }}>
                <span className="ft-meta">CKEditor · estilo Furret</span>
                <InternalLink href="/smartrotom/furrettoday/editar" className="ft-btn is-sm">← Volver a la lista</InternalLink>
              </div>
            </div>
          </div>
        </main>

        <FurretFooter />
      </div>
      <PopStyles />
    </div>
  )
}
