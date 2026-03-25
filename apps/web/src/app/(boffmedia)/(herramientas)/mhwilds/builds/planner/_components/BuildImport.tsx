import { useRef, useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Upload, AlertCircle } from "lucide-react";
import { BuildDataWithIds } from "../../../../../../../types/tools/mhwilds";
import { Alert, AlertDescription } from "@/components/ui/primitives/alert";
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
        
        // Basic validation
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
        <Alert className="mb-3 bg-red-900/20 border-red-800 text-red-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button 
        variant="outline" 
        className="w-full border-dashed border-2 py-6 mb-4"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-5 w-5 mr-2" />
        {t("build_planner.import_build")}
      </Button>
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