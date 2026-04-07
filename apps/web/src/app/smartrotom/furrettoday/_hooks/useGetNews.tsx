import { News } from "@boffmedia/shared";
import { useGetAllNews } from "@/hooks/documents/useGetAllNews";
import { useEffect, useState } from "react";

export function useGetNews(): { featured: News | undefined; published: News[]; news: News[], fetchNews: () => void, setNews: React.Dispatch<React.SetStateAction<News[]>> } {
  const [featured, setFeatured] = useState<News>();
  const [published, setPublished] = useState<News[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const { news: allNews, isLoading, error } = useGetAllNews();

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    const res = await allNews;
    if (res && res.length > 0) {
      const featured = res[0];
      const news = res;
      setFeatured(featured);
      setNews(news);
      setPublished(news.filter((n: News) => n.id !== featured.id).filter((n: News) => n.published === 1));
    }
  }

  return { featured, published, news, fetchNews, setNews }
}