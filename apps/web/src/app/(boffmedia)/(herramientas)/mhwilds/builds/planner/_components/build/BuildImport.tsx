import { useRef, useState } from "react";
import { Upload, AlertCircle } from "lucide-react";
import { BuildDataWithIds } from "@/types/tools/mhwilds";
import { useTranslations } from "next-intl";

interface BuildImportProps {
  onImport: (build: BuildDataWithIds) => void;
}

export function BuildImport({ onImport }: BuildImportProps) {
  const t = useTranslations("mhwilds");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (!event.target?.result) throw new Error(t("build_planner.error_reading_file"));
        const buildData = JSON.parse(event.target.result as string) as BuildDataWithIds;
        if (!buildData.name || !Array.isArray(buildData.decorations)) {
          throw new Error(t("build_planner.error_invalid_file_format"));
        }
        onImport(buildData);
        setError(null);
      } catch (err) {
        console.error("Error parsing build file:", err);
        setError(t("build_planner.error_invalid_file_format_full"));
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      {error && (
        <div
          className="mb-3 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2"
          style={{
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.28)",
            color: "rgba(252,165,165,0.9)",
          }}
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        className="w-full py-6 mb-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
        style={{
          border: "2px dashed rgba(249,115,22,0.28)",
          background: "rgba(249,115,22,0.03)",
          color: "rgba(251,146,60,0.7)",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "rgba(249,115,22,0.07)";
          e.currentTarget.style.borderColor = "rgba(249,115,22,0.45)";
          e.currentTarget.style.color = "rgba(251,146,60,0.9)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "rgba(249,115,22,0.03)";
          e.currentTarget.style.borderColor = "rgba(249,115,22,0.28)";
          e.currentTarget.style.color = "rgba(251,146,60,0.7)";
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-5 w-5" />
        <span className="text-sm font-mono uppercase tracking-widest">{t("build_planner.import_build")}</span>
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
    </>
  );
}
