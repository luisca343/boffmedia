"use client"
import React from 'react'
import CustomEditor from '@/components/editor/TestEditor'

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
  return (
    <div className="w-[80%] bg-white p-6 overflow-hidden">
      {selectedNewsId !== null ? (
        <div className="w-full h-full">
          <CustomEditor
            document={news.find((item) => item.id === selectedNewsId)}
            documentId={selectedNewsId}
            type="news"
            updateNews={updateNews}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full bg-yellow-100 border-8 border-black rounded-3xl">
          <h1 className="text-5xl font-bold mb-4 text-pink-500 pop-shadow">
            ¡Bienvenido a Furret Today Editor!
          </h1>
          <p className="text-2xl text-blue-500 text-center pop-shadow">
            Selecciona una noticia del menú lateral o crea una nueva para
            comenzar a editar.
          </p>
          <img
            src="/smartrotom/img/apps/noticias/furret2.png"
            alt="Furret"
            className="mt-8 transform -rotate-12"
          />
        </div>
      )}
    </div>
  )
}