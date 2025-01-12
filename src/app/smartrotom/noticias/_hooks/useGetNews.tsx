import { useGetAllNews } from "@/hooks/documents/useGetAllNews";
import { useEffect, useState } from "react";

export type News = {
  id: number;
  title: string;
  subtitle: string;
  subcategory: string;
  published: number;
  featured: number;
  content: string;
  buttonText: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export function useGetNews(): { featured: News | undefined; published: News[]; news: News[], fetchNews: () => void, setNews: React.Dispatch<React.SetStateAction<News[]>> } {
  const [featured, setFeatured] = useState<News>();
  const [published, setPublished] = useState<News[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const { getNews, loading, error } = useGetAllNews();

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    const res = await getNews();
    if (res) {
      const { featured, news } = res as { featured: News; news: News[] };
      setFeatured(featured);
      setNews(news);
      setPublished(news.filter((n: News) => n.id !== featured.id).filter((n: News) => n.published === 1));
    }
  }

  return { featured, published, news, fetchNews, setNews }
}