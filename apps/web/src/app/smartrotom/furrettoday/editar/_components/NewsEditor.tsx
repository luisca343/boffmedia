'use client'

import React, { useState, Suspense } from 'react'
import { Button } from '@/components/ui/primitives/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/primitives/dialog'
import { useNews } from '../_hooks/useNews'
import FurretHeader from '../../_components/Header'
import FurretFooter from '../../_components/Footer'
import PopArtWallpaper from '../../_components/PopArtWallpaper'
import { InternalLink } from "@/components/ui/navigation/Link"
import { sendToast } from '@/lib/toast'
import { useBoffSession } from '@/services/useBoffSession'
import { USER_ROLES } from '@boffmedia/shared/roles'

const NewsList = React.lazy(() => import('./NewsList'))
const NewsContent = React.lazy(() => import('./NewsContent'))
const NewsManager = React.lazy(() => import('../../_components/NewsManager'))
const PopStyles = React.lazy(() => import('../../_components/PopStyles'))

export default function NewsEditor() {
  const { hasRole, status } = useBoffSession()
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
      <div className="min-h-full relative overflow-auto">
        <div className="absolute inset-0">
          <PopArtWallpaper />
        </div>
        <div className="relative z-10 min-h-full flex items-center justify-center p-8">
          <div className="bg-yellow-300 card-pop p-8 text-center">
            <h2 className="text-pop-4xl font-bold mb-6 text-pink-500 pop-shadow">¡CARGANDO!</h2>
            <p className="text-pop-xl font-comic text-secondary-active">Verificando permisos... 🔐</p>
          </div>
        </div>
      </div>
    )
  }

  if (!canManageNews) {
    return (
      <div className="min-h-full relative overflow-auto">
        <div className="absolute inset-0">
          <PopArtWallpaper />
        </div>
        <div className="relative z-10 min-h-full flex items-center justify-center p-8">
          <div className="bg-red-100 card-pop p-8 text-center border-4 border-black max-w-2xl">
            <h2 className="text-pop-3xl font-bold mb-4 text-red-600 pop-shadow">ACCESO DENEGADO</h2>
            <p className="text-pop-lg font-comic text-secondary-active mb-6">
              Necesitas el rol ROTOM_ADMIN o ROTOM_FURRET para editar noticias.
            </p>
            <InternalLink href="/smartrotom/furrettoday" className="btn-pop-primary pop-focus animate-button-press">
              🏠 Volver a Furret Today
            </InternalLink>
          </div>
        </div>
      </div>
    )
  }

  function updateNews(id: number, content: string) {
    const newNews = news.map(item => ({...item}));
    const itemToUpdate = newNews.find(item => item.id === id);
    
    if (itemToUpdate) {
      itemToUpdate.content = content;

      const featuredNews = newNews.find(item => item.id === featuredNewsId);
      const otherNews = newNews.filter(item => item.id !== featuredNewsId);
      
      setNews({
        featured: featuredNews!,
        news: otherNews
      });
      
      sendToast(`Cambios guardados en ${itemToUpdate.title}`);
    } else {
      console.error(`News item with ID ${id} not found`);
    }
  }

  function handleNewsSaved() {
    fetchNews()
    setIsDialogOpen(false)
  }

  return (
      <div className="min-h-full relative overflow-auto">
        <div className="absolute inset-0">
          <PopArtWallpaper />
        </div>
        <div className="relative z-10 min-h-full text-black p-4 md:p-8">
          <div className="max-w-7xl mx-auto bg-white card-pop flex flex-col overflow-hidden">
            <FurretHeader />
          
          {/* Navigation breadcrumbs */}
          <div className="bg-secondary-soft p-6 flex flex-wrap items-center font-comic border-b-4 border-black">
            <InternalLink href="furrettoday" className="text-secondary hover:underline text-pop-lg pop-focus">
              🏠 Inicio
            </InternalLink>
            <span className="mx-3 text-pop-lg font-bold"> ⚡ </span>
            <span className="font-bold text-pink-500 text-pop-lg pop-shadow">📝 Editor de Noticias</span>
            
            {/* Action buttons in breadcrumb bar */}
            <div className="ml-auto">
              <button
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                className={`btn-pop-primary pop-focus animate-button-press ${
                  !hasUnsavedChanges ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                💾 Guardar Cambios
              </button>
            </div>
          </div>
          
          {/* Main editor interface - with proper height and structure */}
          <div className="flex flex-grow flex-col md:flex-row">
            {/* Sidebar - Ensuring it stretches full height */}
            <div className="w-full md:w-[30%] lg:w-[25%] bg-pink-500 border-r-8 border-black editor-sidebar relative">
              {/* Subtle halftone background */}
              <div className="absolute inset-0 ben-day-dots-strong"></div>
              
              <div className="p-6 relative z-10">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="btn-pop-secondary w-full pop-focus animate-button-press">
                      ✨ Nueva Noticia
                    </button>
                  </DialogTrigger>
                  <DialogContent className="w-[min(92vw,48rem)] max-w-3xl border-4 border-black bg-[#fff7d6] p-0 overflow-hidden">
                    <DialogHeader className="sr-only">
                      <DialogTitle>Crear nueva noticia</DialogTitle>
                    </DialogHeader>
                    <Suspense fallback={
                      <div className="text-pop-3xl font-comic text-center p-8">
                        Cargando editor... 📝
                      </div>
                    }>
                      <NewsManager onClose={() => setIsDialogOpen(false)} onSaved={handleNewsSaved} />
                    </Suspense>
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Comic style title banner */}
              <div className="bg-yellow-300 py-4 border-y-4 border-black relative z-10">
                <h2 className="text-center text-secondary text-pop-xl font-bold pop-shadow">
                  📰 LISTA DE NOTICIAS
                </h2>
              </div>
              
              {/* News list - Ensuring it takes all remaining space */}
              <div className="flex-grow flex flex-col px-6 py-4 overflow-y-auto relative z-10">
                <Suspense fallback={
                  <div className="text-white text-center p-4">
                    <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                    <span className="font-comic text-pop-lg">Cargando noticias... 📰</span>
                  </div>
                }>
                  {isLoading ? (
                    <div className="text-white text-center p-4">
                      <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                      <span className="font-comic text-pop-lg">Cargando noticias... 📰</span>
                    </div>
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
            </div>
            
            {/* Main content area */}
            <Suspense fallback={
              <div className="w-full md:w-[70%] lg:w-[75%] bg-white flex items-center justify-center text-pop-3xl font-comic p-8 text-center">
                <div className="animate-bounce">Cargando editor... ✏️</div>
              </div>
            }>
              <div className="w-full md:w-[70%] lg:w-[75%]">
                <NewsContent
                  selectedNewsId={selectedNewsId}
                  news={news}
                  updateNews={updateNews}
                />
              </div>
            </Suspense>
          </div>
          
          {/* Footer */}
          <FurretFooter />
        </div>
      </div>
      
      <PopStyles />
    </div>
  )
}