import { useRotomRequest } from "../useRotomRequest";
import { DocumentsService } from "@/services/api/smartrotom/documentsService";
import { CreateNewsDto } from "@boffmedia/shared";

export function useUpdateActiveNews() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(DocumentsService.updateActiveNews)

  const updateActiveNews = (newsId: number, newsData: CreateNewsDto) => {
    return DocumentsService.updateActiveNews(newsId, newsData);
  }

  return {
    updatedNews: data,
    error,
    isLoading,
    refetch,
    updateActiveNews,
    setUpdatedNews: setData
  }
}

