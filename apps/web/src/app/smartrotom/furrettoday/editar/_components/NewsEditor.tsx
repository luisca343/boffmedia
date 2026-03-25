'use client'

import React, { useState, Suspense } from 'react'
import { Button } from '@/components/ui/primitives/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/primitives/dialog'
import { useNews } from '../_hooks/useNews'
import FurretHeader from '../../_components/Header'
import FurretFooter from '../../_components/Footer'
import PopArtWallpaper from '../../_components/PopArtWallpaper'
import { InternalLink } from "@/components/ui/navigation/Link"
import { sendToast } from '@/lib/toast'

const NewsList = React.lazy(() => import('./NewsList'))
const NewsContent = React.lazy(() => import('./NewsContent'))
const NewsManager = React.lazy(() => import('../../_components/NewsManager'))
const PopStyles = React.lazy(() => import('../../_components/PopStyles'))

export default function NewsEditor() {
  const { 
    news, 
    setNews, 
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

  return (
      <div className="min-h-full relative overflow-auto">
        <div className="absolute inset-0">
          <PopArtWallpaper />
        </div>
        <div className="relative z-10 min-h-full text-black p-4 md:p-8">
          <div className="max-w-7xl mx-auto bg-white card-pop flex flex-col overflow-hidden">
            <FurretHeader />
          
          {/* Navigation breadcrumbs */}
          <div className="bg-secondary-100 p-6 flex flex-wrap items-center font-comic border-b-4 border-black">
            <InternalLink href="furrettoday" className="text-secondary-500 hover:underline text-pop-lg pop-focus">
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
                  <DialogContent className="bg-yellow-300 border-8 border-black p-6 max-w-3xl w-11/12 card-pop">
                    <Suspense fallback={
                      <div className="text-pop-3xl font-comic text-center p-8">
                        Cargando editor... 📝
                      </div>
                    }>
                      <NewsManager onClose={() => setIsDialogOpen(false)} />
                    </Suspense>
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Comic style title banner */}
              <div className="bg-yellow-300 py-4 border-y-4 border-black relative z-10">
                <h2 className="text-center text-secondary-500 text-pop-xl font-bold pop-shadow">
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