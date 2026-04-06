import { useState } from "react";
import { Save, Share2, RefreshCw, Copy, Download, Link, ChevronLeft, FolderOpen } from "lucide-react";
import { LuShield } from "react-icons/lu";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { useTranslations } from "next-intl";
import { BuildDataWithIds, BuildData, StatsData, Skill } from "@/types/tools/mhwilds";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/primitives/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/primitives/dropdown-menu";
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

// ─── Notification colors ──────────────────────────────────────────────────────

const notifTokens = {
  success: {
    bg:     "rgba(132,204,22,0.07)",
    border: "rgba(132,204,22,0.28)",
    color:  "rgba(163,230,53,0.9)",
  },
  error: {
    bg:     "rgba(239,68,68,0.07)",
    border: "rgba(239,68,68,0.28)",
    color:  "rgba(252,165,165,0.9)",
  },
  info: {
    bg:     "rgba(34,211,238,0.06)",
    border: "rgba(34,211,238,0.25)",
    color:  "rgba(103,232,249,0.9)",
  },
}

// ─── Summary row ──────────────────────────────────────────────────────────────

function SummaryRow({ label, value, labelColor }: { label: string; value: string; labelColor: string }) {
  return (
    <div
      className="flex justify-between items-center p-2 rounded-md"
      style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(71,85,105,0.2)" }}
    >
      <span className={`font-medium ${labelColor}`}>{label}:</span>
      <span className="text-surface-200 text-sm">{value}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

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
    } catch {
      showNotification("error", t("build_planner.error_saving"));
    }
  };

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(buildData, null, 2));
      showNotification("success", t("build_planner.copied_clipboard"));
    } catch {
      showNotification("error", t("build_planner.error_copying"));
    }
  };

  const handleShareableLink = () => {
    try {
      const shareableUrl = generateShareableLink(buildData);
      navigator.clipboard.writeText(shareableUrl);
      showNotification("success", t("build_planner.link_copied", { url: shareableUrl }));
    } catch {
      showNotification("error", t("build_planner.error_link"));
    }
  };

  const handleExportJson = () => {
    try {
      exportBuildAsJson(buildData);
      const fileName = `${buildData.name.replace(/\s+/g, "-")}-${Date.now()}.json`;
      showNotification("success", t("build_planner.exported_json", { fileName }));
    } catch {
      showNotification("error", t("build_planner.error_exporting"));
    }
  };

  const handleLoadBuild = (build: BuildDataWithIds) => {
    if (onLoadBuild) {
      onLoadBuild(build);
      showNotification("success", t("build_planner.build_loaded", { name: build.name }));
    }
  };

  const showNotification = (type: "success" | "error" | "info", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: null, message: "" }), 3000);
  };

  const renderBuildSummary = () => (
    <div className="space-y-4 mt-4">
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest mb-2 text-surface-300"
          style={{ fontFamily: "Orbitron, sans-serif" }}>
          {t("equipment")}
        </h3>
        <div className="space-y-1.5">
          {completeData.weapon  && <SummaryRow label={t("weapon")}  value={completeData.weapon.name}  labelColor="text-red-400" />}
          {completeData.head    && <SummaryRow label={t("head")}    value={completeData.head.name}    labelColor="text-secondary-400" />}
          {completeData.chest   && <SummaryRow label={t("chest")}   value={completeData.chest.name}   labelColor="text-highlight-400" />}
          {completeData.arms    && <SummaryRow label={t("arms")}    value={completeData.arms.name}    labelColor="text-yellow-400" />}
          {completeData.waist   && <SummaryRow label={t("waist")}   value={completeData.waist.name}   labelColor="text-accent-400" />}
          {completeData.legs    && <SummaryRow label={t("legs")}    value={completeData.legs.name}    labelColor="text-cyan-400" />}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-black uppercase tracking-widest mb-2 text-surface-300"
          style={{ fontFamily: "Orbitron, sans-serif" }}>
          {t("skills")}
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {skills.sort((a, b) => b.level - a.level).map((skill) => (
            <div
              key={skill.id}
              className="flex justify-between p-2 rounded-md"
              style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(71,85,105,0.2)" }}
            >
              <span className="text-sm text-surface-200">{skill.name}</span>
              <span className={skill.level > skill.maxLevel ? "text-yellow-400 text-sm" : "text-highlight-400 text-sm"}>
                Nv. {Math.min(skill.level, skill.maxLevel)}/{skill.maxLevel}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-black uppercase tracking-widest mb-2 text-surface-300"
          style={{ fontFamily: "Orbitron, sans-serif" }}>
          {t("stats")}
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          <SummaryRow label={t("defense")}  value={String(stats.defenseMin)} labelColor="text-secondary-400" />
          <SummaryRow label={t("attack")}   value={String(stats.attack)}     labelColor="text-red-400" />
          <SummaryRow
            label={t("affinity")}
            value={`${stats.affinity >= 0 ? '+' : ''}${stats.affinity}%`}
            labelColor={stats.affinity >= 0 ? "text-highlight-400" : "text-red-400"}
          />
          {stats.element && (
            <SummaryRow label={t("element")} value={`${stats.element.type} ${stats.element.damage}`} labelColor="text-accent-400" />
          )}
          {stats.status && (
            <SummaryRow label={t("status")}  value={`${stats.status.type} ${stats.status.damage}`} labelColor="text-amber-400" />
          )}
        </div>
      </div>

      {shareUrl && (
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest mb-2 text-surface-300"
            style={{ fontFamily: "Orbitron, sans-serif" }}>
            {t("build_planner.share_link")}
          </h3>
          <div className="flex gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="bg-surface-900/60 border-surface-700/60 text-surface-300"
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
      {/* Notification */}
      {notification.type && (
        <div
          className="mb-3 px-4 py-2.5 rounded-lg text-sm font-medium"
          style={{
            background: notifTokens[notification.type].bg,
            border:     `1px solid ${notifTokens[notification.type].border}`,
            color:      notifTokens[notification.type].color,
          }}
        >
          {notification.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <LuShield className="mr-2 h-6 w-6 text-highlight-400 hidden sm:block" />
          <div>
            <h1
              className="text-2xl sm:text-3xl font-black uppercase tracking-widest"
              style={{ fontFamily: "Orbitron, sans-serif", color: "rgb(226,232,240)" }}
            >
              {t("build_planner.title")}
            </h1>
            <p className="text-surface-400 text-sm mt-1">{t("build_planner.subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Input
            value={buildName}
            onChange={(e) => onBuildNameChange(e.target.value)}
            className="max-w-[250px] bg-surface-900/60 border-surface-700/60 placeholder:text-surface-500"
            placeholder={t("build_planner.build_name_placeholder")}
          />

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="text-highlight-400 border-highlight-500/50"
              onClick={handleSave}
            >
              <Save className="mr-1 h-4 w-4" /> {t("build_planner.save")}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-secondary-400 border-secondary-500/50"
              onClick={() => setShowSavedBuilds(true)}
            >
              <FolderOpen className="mr-1 h-4 w-4" /> {t("build_planner.open")}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-surface-300">
                  <Share2 className="mr-1 h-4 w-4" /> {t("build_planner.share")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="border-0 text-surface-100"
                style={{
                  background: "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(9,13,27,0.99))",
                  border: "1px solid rgba(249,115,22,0.18)",
                }}
              >
                <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-widest text-surface-500">
                  {t("build_planner.share_options")}
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={handleShareableLink} className="cursor-pointer">
                  <Link className="h-4 w-4 mr-2" />
                  <span>{t("build_planner.share_link")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJson} className="cursor-pointer">
                  <Download className="h-4 w-4 mr-2" />
                  <span>{t("build_planner.export_json")}</span>
                </DropdownMenuItem>
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

      {/* Details dialog */}
      <Dialog open={showDialog !== null} onOpenChange={(open) => !open && setShowDialog(null)}>
        <DialogContent
          className="max-w-2xl border-0 text-surface-100"
          style={{
            background: "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(9,13,27,0.99))",
            border: "1px solid rgba(249,115,22,0.2)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-widest"
              style={{ fontFamily: "Orbitron, sans-serif" }}>
              {showDialog === "share" ? t("build_planner.share") : t("build_planner.details")}
              <span className="ml-2 text-primary-400 normal-case">{buildData.name}</span>
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

      {/* Saved builds manager */}
      <SavedBuildsManager
        open={showSavedBuilds}
        onOpenChange={setShowSavedBuilds}
        onLoadBuild={handleLoadBuild}
      />
    </div>
  );
}
