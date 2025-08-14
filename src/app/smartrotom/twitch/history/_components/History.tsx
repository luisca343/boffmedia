"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ContentGrid } from "../../_components/ContentGrid";
import { LoadingSpinner } from "../../_components/LoadingSpinner";
import { HistoryItem, getHistory, clearHistory, removeFromHistory } from "../../_services/historyService";
import { useTranslations } from "next-intl";

export const HistoryView = () => {
  const t = useTranslations("twitch");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'stream' | 'video' | 'clip'} | null>(null);

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

  const handleRemoveItem = (id: string, type: 'stream' | 'video' | 'clip') => {
    removeFromHistory(id, type);
    setHistory(prev => prev.filter(item => !(item.id === id && item.type === type)));
    setItemToDelete(null);
  };

  const confirmDelete = (id: string, type: 'stream' | 'video' | 'clip') => {
    setItemToDelete({ id, type });
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return <LoadingSpinner size="large" message={t("loading.history")} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center">
          <span className="bg-purple-600 h-8 w-2 rounded-full mr-3"></span>
          {t("history.title")}
        </h1>
        
        {history.length > 0 && (
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="error" 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => setItemToDelete(null)}
              >
                <Trash2 className="h-4 w-4 mr-2" /> {t("history.clearButton")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {itemToDelete ? t("history.removeConfirm") : t("history.clearConfirm")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {itemToDelete ? t("history.removeDescription") : t("history.clearDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("history.cancelButton")}</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => itemToDelete ? handleRemoveItem(itemToDelete.id, itemToDelete.type) : handleClearHistory()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {itemToDelete ? t("history.removeButton") : t("history.confirmButton")}
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
        <ContentGrid 
          history={history} 
          title="" 
          allowRemoval={true}
          onRemoveItem={confirmDelete}
        />
      )}
    </div>
  );
};
