import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NewsItem } from "../page";
import { useUpdateActiveNews } from "@/hooks/documents/useUpdateActiveNews";
import { CreateNewsDto } from "@/types/dto/create-news-dto";

interface NewsManagerProps {
  initialNews?: CreateNewsDto;
  onClose?: () => void;
}

const NewsManager: React.FC<NewsManagerProps> = ({ initialNews }) => {
  const { updateActiveNews } = useUpdateActiveNews();
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
    updateActiveNews(news.id, news);
  };

  return (
    <Card className="bg-yellow-300 border-none">
      <CardContent>
        <h2 className="text-4xl font-bold mb-6 text-pink-500 pop-shadow">
          {initialNews ? "¡Edita la Noticia!" : "¡Crea una Nueva Noticia!"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="title"
            value={news.title}
            onChange={handleChange}
            placeholder="Título"
            className="border-4 border-black text-xl font-comic"
          />
          <Input
            name="subtitle"
            value={news.subtitle}
            onChange={handleChange}
            placeholder="Subtítulo"
            className="border-4 border-black text-xl font-comic"
          />
          <Input
            name="buttonText"
            value={news.buttonText}
            onChange={handleChange}
            placeholder="Texto del botón"
            className="border-4 border-black text-xl font-comic"
          />
          <Input
            name="imageUrl"
            value={news.imageUrl}
            onChange={handleChange}
            placeholder="URL de la imagen"
            className="border-4 border-black text-xl font-comic"
          />
          <Button
            type="submit"
            className="bg-pink-500 text-white hover:bg-pink-600 font-bold py-3 px-6 rounded-full text-xl transform hover:scale-110 transition-transform button-pop-shadow"
          >
            ¡Guardar Noticia!
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewsManager;
