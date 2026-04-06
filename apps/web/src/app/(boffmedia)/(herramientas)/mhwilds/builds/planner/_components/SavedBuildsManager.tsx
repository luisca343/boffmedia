import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/primitives/dialog";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { ScrollArea } from "@/components/ui/primitives/scroll-area";
import { Trash2, Clock, FileDown, Search, Loader2, FolderOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { BuildDataWithIds } from "@/types/tools/mhwilds";
import { getSavedBuilds, loadBuildFromLocalStorage, deleteBuildFromLocalStorage } from "../_utils/buildUtils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface SavedBuildsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadBuild: (build: BuildDataWithIds) => void;
}

export function SavedBuildsManager({ open, onOpenChange, onLoadBuild }: SavedBuildsManagerProps) {
  const t = useTranslations("mhwilds");
  const [builds, setBuilds] = useState<Array<{
    key: string;
    name: string;
    savedAt: string;
    build: BuildDataWithIds;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (open) loadBuilds();
  }, [open]);

  const loadBuilds = () => {
    setLoading(true);
    try {
      setBuilds(getSavedBuilds());
    } catch (error) {
      console.error("Error loading builds:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadBuild = (key: string) => {
    try {
      const build = loadBuildFromLocalStorage(key);
      if (build) {
        onLoadBuild(build);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error loading build:", error);
    }
  };

  const handleDeleteBuild = (key: string) => {
    try {
      if (deleteBuildFromLocalStorage(key)) {
        setBuilds(builds.filter(build => build.key !== key));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error("Error deleting build:", error);
    }
  };

  const filteredBuilds = builds.filter(build =>
    build.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es });
    } catch {
      return "fecha desconocida";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl border-0 text-surface-100"
        style={{
          background: "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(9,13,27,0.99))",
          border: "1px solid rgba(249,115,22,0.2)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2 font-black uppercase tracking-widest"
            style={{ fontFamily: "Orbitron, sans-serif" }}>
            <FolderOpen className="h-5 w-5 text-primary-400" />
            {t("build_planner.saved_builds")}
          </DialogTitle>
          <DialogDescription className="text-surface-400">
            {t("build_planner.saved_builds_description")}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-surface-500" />
            <Input
              placeholder={t("build_planner.search_builds")}
              className="pl-8 bg-surface-900/60 border-surface-700/60 placeholder:text-surface-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary-400" />
            <span className="text-surface-400 text-sm">Cargando builds...</span>
          </div>
        ) : filteredBuilds.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {filteredBuilds.map((build) => (
                <div
                  key={build.key}
                  className="rounded-lg p-3 transition-all duration-200"
                  style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(71,85,105,0.3)" }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-surface-100">{build.name}</h3>
                    {deleteConfirm === build.key ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          onClick={() => handleDeleteBuild(build.key)}
                        >
                          {t("build_planner.confirm")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          {t("build_planner.cancel", { defaultValue: "Cancelar" })}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          onClick={() => setDeleteConfirm(build.key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-primary-400 border-primary-500/40"
                          onClick={() => handleLoadBuild(build.key)}
                        >
                          <FileDown className="h-4 w-4 mr-1" />
                          {t("build_planner.load")}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-[10px] font-mono flex items-center text-surface-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(build.savedAt)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-8 text-center">
            <p className="text-surface-400">
              {searchQuery ? t("build_planner.no_builds_found") : t("build_planner.no_saved_builds")}
            </p>
            {searchQuery && (
              <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">
                {t("build_planner.clear_search")}
              </Button>
            )}
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <div className="text-[10px] font-mono text-surface-500">
            {t("build_planner.build_count", { count: builds.length })}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("build_planner.close", { defaultValue: "Cerrar" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
