'use client'

import React, { useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { useNews } from '../_hooks/useNews'
import FurretHeader from '../../_components/Header'
import FurretFooter from '../../_components/Footer'
import PopArtWallpaper from '../../_components/PopArtWallpaper'
import { InternalLink } from "@/components/nav/Link"
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
      
      <div className="relative z-10 min-h-full p-4 md:p-8 overflow-auto">
        <div className="w-full max-w-[90%] lg:max-w-[80%] mx-auto bg-white shadow-[20px_20px_0_0_rgba(0,0,0,1)] border-8 border-black flex flex-col">
          {/* Header */}
          <FurretHeader />
          
          {/* Navigation breadcrumbs */}
          <div className="bg-blue-100 p-4 flex flex-wrap items-center font-comic">
            <InternalLink href="/noticias" className="text-blue-500 hover:underline">
              Inicio
            </InternalLink>
            <span className="mx-2"> &gt; </span>
            <span className="font-bold text-pink-500">Editor de Noticias</span>
            
            {/* Action buttons in breadcrumb bar */}
            <div className="ml-auto">
              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                className={`bg-green-300 text-blue-500 hover:bg-green-400 font-bold text-lg transform hover:scale-105 transition-transform button-pop-shadow border-4 border-black ${
                  !hasUnsavedChanges ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                💾 Guardar Cambios
              </Button>
            </div>
          </div>
          
          {/* Main editor interface - with proper height and structure */}
          <div className="flex flex-grow flex-col md:flex-row">
            {/* Sidebar - Ensuring it stretches full height */}
            <div className="w-full md:w-[30%] lg:w-[25%] bg-pink-500 border-r-8 border-black flex flex-col">
              <div className="p-4">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-yellow-300 text-blue-500 hover:bg-yellow-400 font-bold text-xl transform hover:scale-105 transition-transform button-pop-shadow border-4 border-black">
                      ✨ Nueva Noticia
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-yellow-300 border-8 border-black p-6 max-w-3xl w-11/12">
                    <Suspense fallback={
                      <div className="text-3xl font-comic text-center p-8">
                        Cargando editor...
                      </div>
                    }>
                      <NewsManager onClose={() => setIsDialogOpen(false)} />
                    </Suspense>
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Comic style title banner */}
              <div className="bg-yellow-300 py-2 border-y-4 border-black">
                <h2 className="text-center text-blue-500 text-xl font-bold pop-shadow">
                  LISTA DE NOTICIAS
                </h2>
              </div>
              
              {/* News list - Ensuring it takes all remaining space */}
              <div className="flex-grow flex flex-col px-4 py-4 overflow-y-auto">
                <Suspense fallback={
                  <div className="text-white text-center p-4">
                    <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                    Cargando noticias...
                  </div>
                }>
                  {isLoading ? (
                    <div className="text-white text-center p-4">
                      <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                      Cargando noticias...
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
              <div className="w-full md:w-[70%] lg:w-[75%] bg-white flex items-center justify-center text-3xl font-comic p-8 text-center">
                <div className="animate-bounce">Cargando editor...</div>
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
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@700&display=swap");

        h1, h2, h3 {
          font-family: "Bangers", cursive;
          letter-spacing: 2px;
        }

        .font-comic {
          font-family: "Comic Neue", cursive;
        }

        .pop-shadow {
          text-shadow: 3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000,
            -1px 1px 0 #000, 1px 1px 0 #000;
        }

        .button-pop-shadow {
          text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000,
            -1px 1px 0 #000, 1px 1px 0 #000;
        }

        /* Make scrollbar match theme */
        ::-webkit-scrollbar {
          width: 12px;
        }

        ::-webkit-scrollbar-track {
          background-color: #fde047;
          border: 2px solid black;
        }

        ::-webkit-scrollbar-thumb {
          background-color: #ec4899;
          border: 2px solid black;
          border-radius: 10px;
        }
        
        /* Fix scroll area in pinksidebar */
        .bg-pink-500 {
          display: flex;
          flex-direction: column;
          min-height: 100%;
        }
        
        /* Ensure proper overflow behaviors */
        .overflow-y-auto {
          overflow-y: auto !important;
        }
        
        /* Make sure the content area expands fully */
        .flex-grow {
          flex-grow: 1 !important;
        }

        .ck.ck-editor__editable_inline{
          overflow: hidden !important;
          height: 100% !important;
        }

      `}</style>
    </div>
  )
}