'use client'

import React, { useState } from 'react'
import NewsList from './NewsList'
import NewsContent from './NewsContent'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { useNews } from '../_hooks/useNews'
import NewsManager from '../../_components/NewsManager'
import PopStyles from '../../_components/PopStyles'

export default function NewsEditor() {
  const { news, setNews, publishedNewsIds, featuredNewsId, handleSave, hasUnsavedChanges } = useNews()
  const [selectedNewsId, setSelectedNewsId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  function updateNews(id: number, content: string) {
    const newNews = news.map((item) =>
      item.id === id ? { ...item, content } : item
    )
    setNews(newNews)
  }

  return (
    <div className="h-full bg-yellow-200 text-black font-sans overflow-hidden flex">
      <div className="w-[20%] py-4 h-full bg-pink-500 border-r-8 border-black flex flex-col">
        <div className="p-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-yellow-300 text-blue-500 hover:bg-yellow-400 font-bold text-xl transform hover:scale-105 transition-transform button-pop-shadow">
                Nueva Noticia
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-yellow-300 border-8 border-black p-6 max-w-3xl w-11/12 rounded-md">
              <NewsManager />
            </DialogContent>
          </Dialog>
        </div>
        <NewsList
          news={news}
          publishedNewsIds={publishedNewsIds}
          featuredNewsId={featuredNewsId}
          setSelectedNewsId={setSelectedNewsId}
        />
        <div className="p-4">
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className={`w-full bg-green-300 text-blue-500 hover:bg-green-400 font-bold text-xl transform hover:scale-105 transition-transform button-pop-shadow ${
              !hasUnsavedChanges ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Guardar
          </Button>
        </div>
      </div>
      <NewsContent
        selectedNewsId={selectedNewsId}
        news={news}
        updateNews={updateNews}
      />
      <PopStyles />
    </div>
  )
}