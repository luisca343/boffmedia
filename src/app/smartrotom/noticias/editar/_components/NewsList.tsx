import React, { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText } from 'lucide-react'

interface NewsItem {
  id: number
  title: string
}

interface NewsListProps {
  news: NewsItem[]
  publishedNewsIds: number[]
  featuredNewsId: number | null
  setSelectedNewsId: (id: number) => void
}

export default function NewsList({
  news,
  publishedNewsIds,
  featuredNewsId,
  setSelectedNewsId,
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
    if (target.tagName.toLowerCase() !== 'button') {
      setSelectedNewsId(id)
    }
  }

  return (
    <>
      <div className="px-4 mb-4">
        <Input
          placeholder="Buscar noticias..."
          className="w-full border-4 border-black text-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <ScrollArea className="flex-grow">
        {filteredNews.length > 0 ? (
          <div className="px-2">
            {filteredNews.map((item: NewsItem) => (
              <div
                key={item.id}
                onClick={(e) => handleNewsClick(item.id, e)}
                className="p-3 rounded-lg bg-white hover:bg-yellow-100 transition-colors mb-3 cursor-pointer border-4 border-black"
              >
                <div className="flex items-center">
                  <FileText className="h-6 w-6 mr-2 text-blue-500" />
                  <h3 className="font-bold text-lg truncate">{item.title}</h3>
                </div>
                <div className="flex items-center mt-2">
                  <Checkbox
                    id={`published-${item.id}`}
                    checked={publishedNewsIds.includes(item.id)}
                    className="mr-2 border-2 border-black"
                  />
                  <label
                    htmlFor={`published-${item.id}`}
                    className="text-sm font-medium mr-4"
                  >
                    Publicado
                  </label>
                  <Checkbox
                    id={`featured-${item.id}`}
                    checked={item.id === featuredNewsId}
                    className="mr-2 border-2 border-black"
                  />
                  <label
                    htmlFor={`featured-${item.id}`}
                    className="text-sm font-medium"
                  >
                    Destacado
                  </label>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white text-xl p-4 pop-shadow">
            No se encontraron noticias
          </p>
        )}
      </ScrollArea>
    </>
  )
}