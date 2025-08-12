"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { VideoGrid } from "../../_components/VideoGrid";
import { LoadingSpinner } from "../../_components/LoadingSpinner";
import { getHistory, clearHistory, removeFromHistory, HistoryItem } from "../../_services/historyService";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const HistoryView = () => {
  const t = useTranslations("youtube");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    setLoading(true);
    const historyItems = getHistory();
    setHistory(historyItems);
    setLoading(false);
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const handleRemoveVideo = (videoId: string) => {
    removeFromHistory(videoId);
    setHistory(prev => prev.filter(item => {
      const id = typeof item.id === 'string' ? item.id : item.id?.videoId || item.snippet.resourceId?.videoId;
      return id !== videoId;
    }));
    setVideoToDelete(null);
  };

  const confirmDelete = (videoId: string) => {
    setVideoToDelete(videoId);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return <LoadingSpinner size="large" message={t("loading.history")} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center">
          <span className="bg-red-600 h-8 w-2 rounded-full mr-3"></span>
          {t("history.title")}
        </h1>
        
        {history.length > 0 && (
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="error" 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => setVideoToDelete(null)}
              >
                <Trash2 className="h-4 w-4 mr-2" /> {t("history.clearButton")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("history.clearConfirm")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {videoToDelete 
                    ? t("history.removeConfirm") 
                    : t("history.clearDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("history.cancelButton")}</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => videoToDelete ? handleRemoveVideo(videoToDelete) : handleClearHistory()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {videoToDelete ? t("history.removeButton") : t("history.confirmButton")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 bg-surface-800 rounded-lg">
          <p className="text-xl text-surface-400">{t("history.empty")}</p>
          <p className="text-surface-500 mt-2">{t("history.emptySubtext")}</p>
        </div>
      ) : (
        <VideoGrid 
          videos={history} 
          title="" 
          allowRemoval={true}
          onRemoveVideo={confirmDelete}
        />
      )}
    </div>
  );
};