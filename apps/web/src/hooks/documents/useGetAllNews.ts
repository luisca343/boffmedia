import { useRotomRequest } from "../useRotomRequest";
import { DocumentsService } from "@/services/api/smartrotom/documentsService";
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

export function useGetAllNews() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(DocumentsService.getAllNews);

  const featured = useMemo(() => data?.featured, [data]);
  const news = useMemo(() => data?.news || [], [data]);
  const published = useMemo(() => 
    news.filter(n => n.id !== featured?.id).filter(n => n.published === 1),
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

