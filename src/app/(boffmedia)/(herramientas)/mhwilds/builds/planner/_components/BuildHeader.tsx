import { useState } from "react";
import { Save, Share2, RefreshCw, Copy, Download, Link, Camera, ChevronLeft, FolderOpen } from "lucide-react";
import { LuShield } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { BuildDataWithIds, BuildData, StatsData, Skill } from "@/types/tools/mhwilds";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportBuildAsJson, generateShareableLink, saveBuildToLocalStorage } from "../_utils/buildUtils";
import { SavedBuildsManager } from "./SavedBuildsManager";

interface BuildHeaderProps {
  buildName: string;
  onBuildNameChange: (name: string) => void;
  buildData: BuildDataWithIds;
  completeData: BuildData;
  stats: StatsData;
  skills: Skill[];
  onReset?: () => void;
  onLoadBuild?: (build: BuildDataWithIds) => void;
}

export function BuildHeader({ 
  buildName, 
  onBuildNameChange, 
  buildData, 
  completeData, 
  stats, 
  skills, 
  onReset,
  onLoadBuild 
}: BuildHeaderProps) {
  const t = useTranslations("mhwilds");
  const [showDialog, setShowDialog] = useState<"share" | "details" | null>(null);
  const [showSavedBuilds, setShowSavedBuilds] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleSave = () => {
    try {
      const key = saveBuildToLocalStorage(buildData);
      showNotification("success", t("build_planner.saved_local", { key }));
    } catch (error) {
      showNotification("error", t("build_planner.error_saving"));
    }
  };

  // Copy build JSON to clipboard
  const handleCopy = () => {
    try {
      const buildJson = JSON.stringify(buildData, null, 2);
      navigator.clipboard.writeText(buildJson);
      showNotification("success", t("build_planner.copied_clipboard"));
    } catch (error) {
      console.error("Error copying build:", error);
      showNotification("error", t("build_planner.error_copying"));
    }
  };

  // Generate shareable URL using utility function
  const handleShareableLink = () => {
    try {
      const shareableUrl = generateShareableLink(buildData);
      navigator.clipboard.writeText(shareableUrl);
      showNotification("success", t("build_planner.link_copied", { url: shareableUrl}));
    } catch (error) {
      console.error("Error generating shareable link:", error);
      showNotification("error", t("build_planner.error_link",));
    }
  };
  // Export build as JSON using utility function
  const handleExportJson = () => {
    try {
      exportBuildAsJson(buildData);
      const fileName = `${buildData.name.replace(/\s+/g, "-")}-${Date.now()}.json`;
      showNotification("success", t("build_planner.exported_json", { fileName }));
    } catch (error) {
      console.error("Error exporting build:", error);
      showNotification("error", t("build_planner.error_exporting"));
    }
  };

  // Function to handle loading a build from saved builds
  const handleLoadBuild = (build: BuildDataWithIds) => {
    if (onLoadBuild) {
      onLoadBuild(build);
      showNotification("success", t("build_planner.build_loaded", { name: build.name }));
    }
  };

  // Open the saved builds manager
  const openSavedBuildsManager = () => {
    setShowSavedBuilds(true);
  };

  // Generate a build summary image (placeholder)
  const generateImage = () => {
    showNotification("info", t("build_planner.image_placeholder"));
    setShowDialog("details");
  };

  // Helper function to show and then auto-hide notifications
  const showNotification = (type: "success" | "error" | "info", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: null, message: "" }), 3000);
  };

  // Build summary for the share dialog
  const renderBuildSummary = () => (
    <div className="space-y-4 mt-4">
      <div>
        <h3 className="text-lg font-medium mb-2">{t("equipment")}</h3>
        <div className="space-y-2">
          {completeData.weapon && (
            <div className="bg-surface-700/30 p-2 rounded">
              <span className="font-medium text-red-400">{t("weapon")}:</span> {completeData.weapon.name}
            </div>
          )}
          {completeData.head && (
            <div className="bg-surface-700/30 p-2 rounded">
              <span className="font-medium text-blue-400">{t("head")}:</span> {completeData.head.name}
            </div>
          )}
          {completeData.chest && (
            <div className="bg-surface-700/30 p-2 rounded">
              <span className="font-medium text-green-400">{t("chest")}:</span> {completeData.chest.name}
            </div>
          )}
          {completeData.arms && (
            <div className="bg-surface-700/30 p-2 rounded">
              <span className="font-medium text-yellow-400">{t("arms")}:</span> {completeData.arms.name}
            </div>
          )}
          {completeData.waist && (
            <div className="bg-surface-700/30 p-2 rounded">
              <span className="font-medium text-purple-400">{t("waist")}:</span> {completeData.waist.name}
            </div>
          )}
          {completeData.legs && (
            <div className="bg-surface-700/30 p-2 rounded">
              <span className="font-medium text-cyan-400">{t("legs")}:</span> {completeData.legs.name}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">{t("skills")}</h3>
        <div className="grid grid-cols-2 gap-2">
          {skills
            .sort((a, b) => b.level - a.level)
            .map((skill) => (
              <div key={skill.id} className="bg-surface-700/30 p-2 rounded flex justify-between">
                <span>{skill.name}</span>
                <span className={skill.level > skill.maxLevel ? "text-yellow-400" : "text-green-400"}>
                  Nv. {Math.min(skill.level, skill.maxLevel)}/{skill.maxLevel}
                </span>
              </div>
            ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">{t("stats")}</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-700/30 p-2 rounded flex justify-between">
            <span>{t("defense")}</span>
            <span className="text-blue-400">{stats.defense}</span>
          </div>
          <div className="bg-surface-700/30 p-2 rounded flex justify-between">
            <span>{t("attack")}</span>
            <span className="text-red-400">{stats.attack}</span>
          </div>
          <div className="bg-surface-700/30 p-2 rounded flex justify-between">
            <span>{t("affinity")}</span>
            <span className={stats.affinity >= 0 ? "text-green-400" : "text-red-400"}>
              {stats.affinity >= 0 ? '+' : ''}{stats.affinity}%
            </span>
          </div>
          {stats.element && (
            <div className="bg-surface-700/30 p-2 rounded flex justify-between">
              <span>{t("element")}</span>
              <span className="text-purple-400">{stats.element.type} {stats.element.damage}</span>
            </div>
          )}
          {stats.status && (
            <div className="bg-surface-700/30 p-2 rounded flex justify-between">
              <span>{t("status")}</span>
              <span className="text-amber-400">{stats.status.type} {stats.status.damage}</span>
            </div>
          )}
        </div>
      </div>

      {shareUrl && (
        <div>
          <h3 className="text-lg font-medium mb-2">{t("build_planner.share_link")}</h3>
          <div className="flex gap-2">
            <Input 
              value={shareUrl}
              readOnly
              className="bg-surface-700 border-surface-600"
            />
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                showNotification("success", t("build_planner.link_copied", { url: shareUrl }));
              }}
              variant="outline"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="mb-6">
      {/* Notification alert */}
      {notification.type && (
        <Alert
          className={`mb-3 ${
            notification.type === "success" ? "bg-green-900/20 text-green-400" : 
            notification.type === "error" ? "bg-red-900/20 text-red-400" : 
            "bg-blue-900/20 text-blue-400"
          }`}
        >
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <LuShield className="mr-2 h-6 w-6 text-green-400 hidden sm:block" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-surface-50">
              {t("build_planner.title")}
            </h1>
            <p className="text-surface-300 text-sm mt-1">
              {t("build_planner.subtitle")}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Input
            value={buildName}
            onChange={(e) => onBuildNameChange(e.target.value)}
            className="max-w-[250px] bg-surface-700 border-surface-600"
            placeholder={t("build_planner.build_name_placeholder")}
          />
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-green-400 border-green-500"
              onClick={handleSave}
            >
              <Save className="mr-1 h-4 w-4" /> {t("build_planner.save")}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-blue-400 border-blue-500"
              onClick={openSavedBuildsManager}
            >
              <FolderOpen className="mr-1 h-4 w-4" /> {t("build_planner.open")}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-surface-300">
                  <Share2 className="mr-1 h-4 w-4" /> {t("build_planner.share")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-surface-800 border-surface-700 text-surface-100">
                <DropdownMenuLabel>{t("build_planner.share_options")}</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleShareableLink} className="cursor-pointer">
                  <Link className="h-4 w-4 mr-2" />
                  <span>{t("build_planner.share_link")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJson} className="cursor-pointer">
                  <Download className="h-4 w-4 mr-2" />
                  <span>{t("build_planner.export_json")}</span>
                </DropdownMenuItem>
                {/* 
                <DropdownMenuItem onClick={generateImage} className="cursor-pointer">
                  <Camera className="h-4 w-4 mr-2" />
                  <span>{t("build_planner.generate_image")}</span>
                </DropdownMenuItem>
                */}
                <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
                  <Copy className="h-4 w-4 mr-2" />
                  <span>Copiar JSON</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="outline" 
              size="sm" 
              className="text-surface-300"
              onClick={onReset}
            >
              <RefreshCw className="mr-1 h-4 w-4" /> {t("build_planner.reset")}
            </Button>
          </div>
        </div>
      </div>

      {/* Share dialog */}
      <Dialog open={showDialog !== null} onOpenChange={(open) => !open && setShowDialog(null)}>
        <DialogContent className="bg-surface-800 border-surface-700 text-surface-100 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {showDialog === "share" ? t("build_planner.share") : t("build_planner.details")}
              <span className="ml-2 text-primary-400">{buildData.name}</span>
            </DialogTitle>
          </DialogHeader>
          
          {renderBuildSummary()}
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDialog(null)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> {t("build_planner.back")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Saved Builds Manager */}
      <SavedBuildsManager 
        open={showSavedBuilds} 
        onOpenChange={setShowSavedBuilds}
        onLoadBuild={handleLoadBuild}
      />
    </div>
  );
}