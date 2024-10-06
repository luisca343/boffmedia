"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, PlusCircle } from "lucide-react";
import { useGetNews } from "../_hooks/useGetNews";
import PopStyles from "../_components/PopStyles";
import CustomEditor from "@/components/editor/TestEditor";
import { rotomPOST } from "@/services/boffAPI";
import { toast } from "react-toastify";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import NewsManager from "../_components/NewsManager";
import { update } from "@react-spring/web";

export default function EditNewsPage() {
  const { news, setNews } = useGetNews();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredNews, setFilteredNews] = useState(news);
  const [selectedNewsId, setSelectedNewsId] = useState<number | null>(null);
  const [featuredNewsId, setFeaturedNewsId] = useState<number | null>(null);
  const [publishedNewsIds, setPublishedNewsIds] = useState<number[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setFilteredNews(
      news.filter((item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    // Initialize publishedNewsIds and featuredNewsId based on fetched data
    const publishedIds = news
      .filter((item) => item.published)
      .map((item) => item.id);
    const featuredId = news.find((item) => item.featured)?.id || null;

    setPublishedNewsIds(publishedIds);
    setFeaturedNewsId(featuredId);
  }, [news, searchTerm]);

  function handleNewsClick(id: number, event: React.MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName.toLowerCase() !== "button") {
      setSelectedNewsId(id);
    }
  }

  function handlePublishToggle(id: number) {
    setPublishedNewsIds((prev) =>
      prev.includes(id) ? prev.filter((newsId) => newsId !== id) : [...prev, id]
    );
    setHasUnsavedChanges(true);

    if (publishedNewsIds.includes(id) && featuredNewsId === id) {
      setFeaturedNewsId(null);
    }
  }

  function handleFeaturedToggle(id: number) {
    setFeaturedNewsId(id === featuredNewsId ? null : id);
    setHasUnsavedChanges(true);

    if (!publishedNewsIds.includes(id)) {
      setPublishedNewsIds((prev) => [...prev, id]);
    }
  }


  function updateNews(id: number, content: string) {
    const newNews = news.map((item) =>
        item.id === id ? { ...item, content } : item
        );
    setNews(newNews);
  }

  function handleSave() {
    if (!featuredNewsId) {
      return toast.error("Debes seleccionar una noticia destacada");
    }
    rotomPOST("/documents/newsstatus", {
      published: publishedNewsIds,
      featured: featuredNewsId,
    }).then(() => {
      setHasUnsavedChanges(false);
    });
  }

  return (
    <div className="h-full bg-yellow-200 text-black font-sans overflow-hidden flex">
      <div className="w-[30%] py-4 h-full bg-pink-500 border-r-8 border-black flex flex-col">
        <div className="p-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-yellow-300 text-blue-500 hover:bg-yellow-400 font-bold text-xl transform hover:scale-105 transition-transform button-pop-shadow">
                <PlusCircle className="mr-2 h-6 w-6" />
                Nueva Noticia
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-yellow-300 border-8 border-black p-6 max-w-3xl w-11/12 rounded-md">
              <NewsManager />
            </DialogContent>
          </Dialog>
        </div>
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
              {filteredNews.map((item: any) => (
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
                      onCheckedChange={() => handlePublishToggle(item.id)}
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
                      onCheckedChange={() => handleFeaturedToggle(item.id)}
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
        <div className="p-4">
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className={`w-full bg-green-300 text-blue-500 hover:bg-green-400 font-bold text-xl transform hover:scale-105 transition-transform button-pop-shadow ${
              !hasUnsavedChanges ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Guardar
          </Button>
        </div>
      </div>
      <div className="w-[70%] bg-white p-6 overflow-hidden">
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
      <PopStyles />
    </div>
  );
}
