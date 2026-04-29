import React, { useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { DocumentsService } from "@/services/api/smartrotom/documentsService";
import { CreateNewsDto, News } from "@boffmedia/shared";
import { sendToast } from "@/lib/toast";

interface NewsManagerProps {
  initialNews?: CreateNewsDto;
  onClose?: () => void;
  onSaved?: (news: News) => void;
}

const NewsManager: React.FC<NewsManagerProps> = ({ initialNews, onClose, onSaved }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [news, setNews] = useState<CreateNewsDto>(
    initialNews || {
      id: Date.now(),
      title: "",
      subtitle: "",
      content: "",
      buttonText: "Leer más",
      imageUrl: "",
    } as CreateNewsDto
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setNews({ ...news, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const saveRequest = initialNews
      ? DocumentsService.updateNews(news.id, news)
      : DocumentsService.createNews(news);

    saveRequest
      .then((response) => {
        if (!response?.data) {
          throw new Error('No se pudo guardar la noticia');
        }

        sendToast(initialNews ? 'Noticia actualizada' : 'Noticia creada');
        onSaved?.(response.data);
        onClose?.();
      })
      .catch((error) => {
        sendToast(error instanceof Error ? error.message : 'Error al guardar la noticia');
      })
      .finally(() => setIsSaving(false));
  };

  return (
    <div className="bg-[#fff7d6] text-black">
      <div className="border-b-4 border-black bg-yellow-300 px-6 py-5">
        <h2 className="text-3xl font-bold text-pink-500 pop-shadow">
          {initialNews ? "¡Edita la Noticia!" : "¡Crea una Nueva Noticia!"}
        </h2>
        <p className="mt-2 text-sm font-comic text-secondary-700">
          Completa los datos principales y guarda para actualizar la lista al instante.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <div className="space-y-2">
          <label htmlFor="news-title" className="block text-sm font-bold uppercase tracking-wide text-secondary-700">
            Titulo
          </label>
          <Input
            id="news-title"
            name="title"
            value={news.title}
            onChange={handleChange}
            placeholder="Titulo"
            className="border-4 border-black bg-white text-base font-comic"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="news-subtitle" className="block text-sm font-bold uppercase tracking-wide text-secondary-700">
            Subtitulo
          </label>
          <Input
            id="news-subtitle"
            name="subtitle"
            value={news.subtitle}
            onChange={handleChange}
            placeholder="Subtitulo"
            className="border-4 border-black bg-white text-base font-comic"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="news-content" className="block text-sm font-bold uppercase tracking-wide text-secondary-700">
            Contenido
          </label>
          <textarea
            id="news-content"
            name="content"
            value={news.content}
            onChange={handleChange}
            placeholder="Escribe el contenido de la noticia"
            rows={8}
            className="w-full resize-y rounded-xl border-4 border-black bg-white px-4 py-3 text-base font-comic outline-none focus:border-pink-500"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="news-button" className="block text-sm font-bold uppercase tracking-wide text-secondary-700">
              Texto del boton
            </label>
            <Input
              id="news-button"
              name="buttonText"
              value={news.buttonText}
              onChange={handleChange}
              placeholder="Leer mas"
              className="border-4 border-black bg-white text-base font-comic"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="news-image" className="block text-sm font-bold uppercase tracking-wide text-secondary-700">
              URL de la imagen
            </label>
            <Input
              id="news-image"
              name="imageUrl"
              value={news.imageUrl}
              onChange={handleChange}
              placeholder="https://..."
              className="border-4 border-black bg-white text-base font-comic"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t-4 border-black pt-5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="border-4 border-black bg-white text-black hover:bg-slate-100"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="border-4 border-black bg-pink-500 px-6 text-white hover:bg-pink-600 disabled:opacity-60"
          >
            {isSaving ? 'Guardando...' : 'Guardar noticia'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewsManager;
