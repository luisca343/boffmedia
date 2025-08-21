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
                  className={`card-pop p-6 cursor-pointer transition-all duration-240ms animate-button-press relative
                    ${isSelected 
                      ? 'bg-yellow-300 text-black transform rotate-1' 
                      : isPublished || isFeatured
                        ? 'bg-white text-black hover:bg-yellow-50' 
                        : 'bg-gray-100 text-gray-600 border-dashed'
                    }`}
                >
                  {/* Pop-art accent bar for featured items */}
                  {isFeatured && (
                    <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-pink-500 to-yellow-400 rounded-t-2xl"></div>
                  )}
                  
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center mr-3 border-3 border-black">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-bold text-pop-lg text-white pr-2 truncate pop-shadow">{item.title}</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <div 
                      className={`btn-pop-checkmark ${isPublished ? 'active' : ''}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        id={`published-${item.id}`}
                        checked={isPublished || isFeatured}
                        onCheckedChange={() => handlePublishToggle(item.id)}
                        className="mr-2 border-3 border-black data-[state=checked]:bg-secondary-500"
                      />
                      <label
                        htmlFor={`published-${item.id}`}
                        className="text-pop-sm font-bold cursor-pointer flex items-center"
                      >
                        <Eye size={16} className="mr-1" /> Publicado
                      </label>
                    </div>
                    
                    <div 
                      className={`btn-pop-checkmark ${isFeatured ? 'active featured' : ''}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        id={`featured-${item.id}`}
                        checked={isFeatured}
                        onCheckedChange={() => handleFeaturedToggle(item.id)}
                        className="mr-2 border-3 border-black data-[state=checked]:bg-yellow-500"
                      />
                      <label
                        htmlFor={`featured-${item.id}`}
                        className="text-pop-sm font-bold cursor-pointer flex items-center"
                      >
                        <Star size={16} className="mr-1" /> Destacado
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