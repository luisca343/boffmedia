"use client"
import CustomEditor from '@/components/shared/ckeditor/TestEditor'
import { useBoffSession } from '@/services/useBoffSession'

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
  const { session } = useBoffSession();
  const token = session?.user?.accessToken ?? '';
  const selectedNews = selectedNewsId !== null ? news.find((item) => item.id === selectedNewsId) : null;
  
  return (
    <div className="w-full h-full bg-white overflow-hidden flex flex-col">
      {selectedNewsId !== null && selectedNews ? (
        <>
          {/* Editor header with title */}
          <div className="bg-secondary-500 text-white p-6 border-b-4 border-black relative">
            {/* Subtle halftone pattern */}
            <div className="absolute inset-0 ben-day-dots"></div>
            <div className="relative z-10 flex items-center justify-between">
              <h2 className="text-pop-2xl font-bold pop-shadow truncate pr-4">
                <span className="text-yellow-300">✏️ Editando:</span> {selectedNews.title}
              </h2>
              {/* Comic-style badge */}
              <div className="bg-yellow-300 text-secondary-600 px-4 py-2 rounded-2xl border-3 border-black transform rotate-3 pop-shadow text-pop-sm font-bold">
                EDITOR ACTIVO
              </div>
            </div>
          </div>
          
          {/* Editor area */}
          <div className="flex-grow overflow-hidden p-6 border-8 border-dotted border-secondary-200 m-6 bg-white rounded-3xl relative">
            {/* Comic-style corner decoration */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-300 border-3 border-black rounded-full flex items-center justify-center transform rotate-12">
              <span className="text-black font-bold text-pop-sm">✨</span>
            </div>
            <CustomEditor
              document={selectedNews}
              documentId={selectedNewsId}
              documentType={1}
              updateNews={updateNews}
              token={token}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full bg-yellow-100 border-8 border-black p-8 relative">
          {/* Background pattern */}
          <div className="absolute inset-0 ben-day-dots opacity-30"></div>
          
          {/* Comic speech bubble */}
          <div className="relative bg-white border-4 border-black p-6 mb-8 max-w-2xl transform -rotate-2 card-pop shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]">
            <div className="absolute h-12 w-12 bg-white border-r-4 border-b-4 border-black transform rotate-45 -bottom-7 left-[calc(50%-16px)]"></div>
            <h1 className="text-pop-4xl font-bold mb-6 text-pink-500 pop-shadow text-center">
              ¡Editor de Noticias!
            </h1>
            <p className="text-pop-xl text-secondary-500 text-center font-comic leading-relaxed">
              🎯 Selecciona una noticia del menú lateral o crea una nueva para comenzar a editar.
            </p>
            
            {/* Fun comic elements */}
            <div className="flex justify-center mt-6 gap-4">
              <div className="bg-yellow-300 px-4 py-2 rounded-full border-3 border-black transform rotate-3">
                <span className="text-pop-sm font-bold">¡NUEVO!</span>
              </div>
              <div className="bg-pink-300 px-4 py-2 rounded-full border-3 border-black transform -rotate-2">
                <span className="text-pop-sm font-bold">¡FÁCIL!</span>
              </div>
            </div>
          </div>
          
          {/* Furret image */}
          <img
            src="/smartrotom/img/apps/furrettoday/furret2.png"
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