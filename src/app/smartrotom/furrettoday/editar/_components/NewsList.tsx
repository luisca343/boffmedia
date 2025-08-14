import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, Star, Eye } from 'lucide-react'

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

  function handleNewsClick(id: number, event: React.MouseEvent) {
    const target = event.target as HTMLElement
    const isCheckboxOrLabel = 
      target.tagName.toLowerCase() === 'input' || 
      target.tagName.toLowerCase() === 'label' ||
      target.closest('label') !== null
      
    if (!isCheckboxOrLabel) {
      setSelectedNewsId(id)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative mb-4">
        <Input
          placeholder="Buscar noticias..."
          className="w-full border-4 border-black text-lg bg-white rounded-full pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          🔍
        </div>
      </div>
      
      {/* Use flex-grow to ensure list takes all available space */}
      <div className="space-y-4 pb-4 flex-grow">
        {filteredNews.length > 0 ? (
          <>
            {filteredNews.map((item: NewsItem) => {
              const isPublished = publishedNewsIds.includes(item.id);
              const isFeatured = item.id === featuredNewsId;
              const isSelected = item.id === selectedNewsId;
              
              return (
                <div
                  key={item.id}
                  onClick={(e) => handleNewsClick(item.id, e)}
                  className={`p-3 rounded-lg cursor-pointer transition-transform transform hover:scale-105
                    ${isSelected 
                      ? 'bg-yellow-300 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]' 
                      : isPublished || isFeatured
                        ? 'bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]' 
                        : 'bg-surface-100 border-4 border-dashed border-surface-500'
                    }`}
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-secondary-500 flex-shrink-0" />
                    <h3 className="font-bold text-lg truncate">{item.title}</h3>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3">
                    <div 
                      className={`flex items-center px-2 py-1 rounded-full border-2 border-black
                        ${isPublished ? 'bg-secondary-100' : 'bg-surface-100'}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ minWidth: '110px' }}
                    >
                      <Checkbox
                        id={`published-${item.id}`}
                        checked={isPublished || isFeatured}
                        onCheckedChange={() => handlePublishToggle(item.id)}
                        className="mr-1 border-2 border-black"
                      />
                      <label
                        htmlFor={`published-${item.id}`}
                        className="text-sm font-medium cursor-pointer flex items-center whitespace-nowrap"
                      >
                        <Eye size={14} className="mr-1" /> Publicado
                      </label>
                    </div>
                    
                    <div 
                      className={`flex items-center px-2 py-1 rounded-full border-2 border-black
                        ${isFeatured ? 'bg-yellow-100' : 'bg-surface-100'}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ minWidth: '110px' }}
                    >
                      <Checkbox
                        id={`featured-${item.id}`}
                        checked={isFeatured}
                        onCheckedChange={() => handleFeaturedToggle(item.id)}
                        className="mr-1 border-2 border-black"
                      />
                      <label
                        htmlFor={`featured-${item.id}`}
                        className="text-sm font-medium cursor-pointer flex items-center whitespace-nowrap"
                      >
                        <Star size={14} className="mr-1" /> Destacado
                      </label>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        ) : (
          <div className="bg-yellow-300 border-4 border-black p-4 rounded-lg text-center">
            <p className="text-xl font-comic">
              No se encontraron noticias 🔍
            </p>
            <p className="text-sm mt-2">
              Prueba con otra búsqueda o crea una nueva noticia
            </p>
          </div>
        )}
        
        <div className="h-4"></div>
      </div>
    </div>
  )
}