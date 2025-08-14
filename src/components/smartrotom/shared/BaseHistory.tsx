"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "./LoadingSpinner";

interface BaseHistoryProps<T> {
  platform: "youtube" | "twitch";
  getHistory: () => T[];
  clearHistory: () => void;
  removeFromHistory: (id: string, type?: string) => void;
  renderItem: (item: T, onRemove: (id: string, type?: string) => void) => React.ReactNode;
  emptyMessage?: string;
  emptySubtext?: string;
}

export function BaseHistory<T extends { id: string; type?: string }>({
  platform,
  getHistory,
  clearHistory,
  removeFromHistory,
  renderItem,
  emptyMessage,
  emptySubtext
}: BaseHistoryProps<T>) {
  const t = useTranslations("common");
  const [history, setHistory] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type?: string} | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

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
    setClearDialogOpen(false);
  };

  const handleRemoveItem = (id: string, type?: string) => {
    removeFromHistory(id, type);
    setHistory(prev => prev.filter(item => !(item.id === id && (!type || item.type === type))));
    setItemToDelete(null);
    setDeleteDialogOpen(false);
  };

  const confirmDelete = (id: string, type?: string) => {
    setItemToDelete({ id, type });
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return <LoadingSpinner size="large" message={t("loading.history")} platform={platform} />;
  }

  const content = (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center">
          <span className={`h-8 w-2 rounded-full mr-3 ${platform === 'youtube' ? 'bg-red-600' : 'bg-purple-600'}`}></span>
          {t("history.title")}
        </h1>
        {history.length > 0 && (
          <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="error" 
                className={`${platform === 'youtube' ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("history.clearButton")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
                  {t("history.clearConfirm")}
                </DialogTitle>
                <DialogDescription>
                  {t("history.clearDescription")}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
                  {t("history.cancelButton")}
                </Button>
                <Button 
                  variant="error" 
                  onClick={handleClearHistory}
                  className={`${platform === 'youtube' ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                >
                  {t("history.confirmButton")}
                </Button>
              </DialogFooter>
              </DialogContent>
          </Dialog>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 bg-surface-800 rounded-lg">
          <div className="text-6xl mb-4">📺</div>
          <h2 className="text-2xl font-semibold mb-2 text-surface-200">
            {emptyMessage || t("history.empty")}
          </h2>
          <p className="text-surface-400">
            {emptySubtext || t("history.emptySubtext")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {history.map((item) => renderItem(item, confirmDelete))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
              {t("history.removeConfirm")}
            </DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("history.cancelButton")}
            </Button>
            <Button 
              variant="error" 
              onClick={() => {
                if (itemToDelete) {
                  handleRemoveItem(itemToDelete.id, itemToDelete.type);
                }
              }}
            >
              {t("history.removeButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {content}
    </div>
  );
}
