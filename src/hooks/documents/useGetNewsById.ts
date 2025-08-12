import { useRotomRequest } from "../useRotomRequest";
import { DocumentsService } from "@/services/api/smartrotom/documentsService";

export type NewsArticle = {
  id: string;
  title: string;
  content: string;
};

export function useGetNewsById(id: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(DocumentsService.getNewsById, id);

  return {
    article: data,
    error,
    isLoading,
    refetch,
    setArticle: setData
  };
}

