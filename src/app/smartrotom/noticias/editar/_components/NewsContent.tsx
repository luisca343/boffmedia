"use client"
import React from 'react'
import CustomEditor from '@/components/ckeditor/TestEditor'

interface NewsContentProps {
  selectedNewsId: number | null
  news: any[]
  updateNews: (id: number, content: string) => void
}

export default function NewsContent({
  selectedNewsId,
  news,
  updateNews,
}: NewsContentProps) {
  const selectedNews = selectedNewsId !== null ? news.find((item) => item.id === selectedNewsId) : null;
  
  return (
    <div className="w-full h-full bg-white overflow-hidden flex flex-col">
      {selectedNewsId !== null && selectedNews ? (
        <>
          {/* Editor header with title */}
          <div className="bg-blue-500 text-white p-4 border-b-4 border-black">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold pop-shadow truncate pr-4">
                <span className="text-yellow-300">Editando:</span> {selectedNews.title}
              </h2>
            </div>
          </div>
          
          {/* Editor area */}
          <div className="flex-grow overflow-hidden p-4 border-8 border-dotted border-blue-200 m-4 bg-white">
            <CustomEditor
              document={selectedNews}
              documentId={selectedNewsId}
              documentType={1}
              updateNews={updateNews}
            />
          </div>
          
          {/* Comic style decoration at bottom */}
          <div className="h-8 bg-yellow-300 border-t-4 border-black relative overflow-hidden">
            <div className="absolute inset-0 flex justify-around items-center opacity-40">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="h-2 w-2 bg-black rounded-full"></div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full bg-yellow-100 border-8 border-black p-8">
          {/* Comic speech bubble */}
          <div className="relative bg-white border-4 border-black p-6 mb-8 max-w-2xl transform -rotate-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]">
            <div className="absolute h-8 w-8 bg-white border-r-4 border-b-4 border-black transform rotate-45 -bottom-4 left-[calc(50%-16px)]"></div>
            <h1 className="text-5xl font-bold mb-4 text-pink-500 pop-shadow text-center">
              ¡Editor de Noticias!
            </h1>
            <p className="text-2xl text-blue-500 text-center font-comic">
              Selecciona una noticia del menú lateral o crea una nueva para
              comenzar a editar.
            </p>
          </div>
          
          {/* Furret image */}
          <img
            src="/smartrotom/img/apps/noticias/furret2.png"
            alt="Furret"
            className="mt-6 transform -rotate-12 max-w-xs"
          />
          
          {/* Comic style action lines */}
          <svg className="absolute bottom-8 left-1/2 transform -translate-x-1/2" width="200" height="40" viewBox="0 0 200 40">
            <line x1="0" y1="20" x2="200" y2="20" stroke="#000" strokeWidth="3" strokeDasharray="10 5" />
            <line x1="20" y1="30" x2="180" y2="30" stroke="#000" strokeWidth="2" strokeDasharray="8 4" />
          </svg>
        </div>
      )}
    </div>
  )
}