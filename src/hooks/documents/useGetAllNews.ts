import { useRotomRequest } from "../useRotomRequest";
import { documentsService } from "@/services/api/smartrotom/documentsService";
import { useMemo } from "react";

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

type NewsResponse = {
  featured: News;
  news: News[];
}

export function useGetAllNews() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest<NewsResponse>(documentsService.getAllNews);

  const featured = useMemo(() => data?.featured, [data]);
  const news = useMemo(() => data?.news || [], [data]);
  const published = useMemo(() => 
    news.filter(n => n.id !== featured?.id && n.published === 1),
    [news, featured]
  );

  return { 
    featured, 
    published, 
    news, 
    fetchNews: refetch, 
    setNews: setData,
    isLoading,
    error
  };
}

