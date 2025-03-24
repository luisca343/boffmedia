import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Save, Share, Download, Link, Camera, Info, ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BuildDataWithIds, BuildData, StatsData, Skill } from "./types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface BuildActionsProps {
  buildData: BuildDataWithIds;
  completeData: BuildData;
  stats: StatsData;
  skills: Skill[];
}

export function BuildActions({ buildData, completeData, stats, skills }: BuildActionsProps) {
  const [showDialog, setShowDialog] = useState<"share" | "details" | null>(null);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });

  // Save build to localStorage
  const handleSave = () => {
    try {
      // Create a unique key using the name and timestamp
      const key = `mhw-build-${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(buildData));
      console.log("Saved build:", buildData);
      showNotification("success", "Build guardado en almacenamiento local");
    } catch (error) {
      console.error("Error saving build:", error);
      showNotification("error", "Error al guardar el build");
    }
  };

  // Copy build JSON to clipboard
  const handleCopy = () => {
    try {
      const buildJson = JSON.stringify(buildData, null, 2);
      navigator.clipboard.writeText(buildJson);
      console.log("Copied build to clipboard");
      showNotification("success", "Build copiado al portapapeles");
    } catch (error) {
      console.error("Error copying build:", error);
      showNotification("error", "Error al copiar el build");
    }
  };

  // Generate shareable URL with encoded build data
  const generateShareableLink = () => {
    try {
      // Compress build data to make URL shorter using base64 encoding
      const compressedData = btoa(encodeURIComponent(JSON.stringify(buildData)));
      
      // Build the URL with the encoded data as a query parameter
      const shareableUrl = `${window.location.origin}${window.location.pathname}?build=${compressedData}`;
      setShareUrl(shareableUrl);
      
      // Copy to clipboard
      navigator.clipboard.writeText(shareableUrl);
      showNotification("success", "Link de compartir copiado al portapapeles");
      setShowDialog("share");
    } catch (error) {
      console.error("Error generating shareable link:", error);
      showNotification("error", "Error al generar el link para compartir");
    }
  };

  // Export build as JSON file
  const exportAsJson = () => {
    try {
      // Prepare the build data as a JSON string
      const dataStr = JSON.stringify(buildData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      // Create a download link and trigger it
      const fileName = `${buildData.name.replace(/\s+/g, "-")}-${Date.now()}.json`;
      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", fileName);
      linkElement.click();
      
      showNotification("success", "Build exportado como archivo JSON");
    } catch (error) {
      console.error("Error exporting build:", error);
      showNotification("error", "Error al exportar el build");
    }
  };

  // Generate a build summary image (placeholder)
  const generateImage = () => {
    showNotification("info", "La funcionalidad de imagen pronto estará disponible");
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
        <h3 className="text-lg font-medium mb-2">Equipamiento</h3>
        <div className="space-y-2">
          {completeData.weapon && (
            <div className="bg-surface-700/30 p-2 rounded">
              <span className="font-medium text-red-400">Arma:</span> {completeData.weapon.name}
            </div>
          )}
          {completeData.head && (
            <div className="bg-surface-700/30 p-2 rounded">
              <span className="font-medium text-blue-400">Casco:</span> {completeData.head.name}
            </div>
          )}
          {completeData.chest && (
            <div className="bg-surface-700/30 p-2 rounded">
              <span className="font-medium text-green-400">Pecho:</span> {completeData.chest.name}
            </div>
          )}
          {completeData.arms && (
            <div className="bg-surface-700/30 p-2 rounded">
              <span className="font-medium text-yellow-400">Brazos:</span> {completeData.arms.name}
            </div>
          )}
          {completeData.waist && (
            <div className="bg-surface-700/30 p-2 rounded">
              <span className="font-medium text-purple-400">Cintura:</span> {completeData.waist.name}
            </div>
          )}
          {completeData.legs && (
            <div className="bg-surface-700/30 p-2 rounded">
              <span className="font-medium text-cyan-400">Piernas:</span> {completeData.legs.name}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Habilidades</h3>
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
        <h3 className="text-lg font-medium mb-2">Estadísticas</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-700/30 p-2 rounded flex justify-between">
            <span>Defensa</span>
            <span className="text-blue-400">{stats.defense}</span>
          </div>
          <div className="bg-surface-700/30 p-2 rounded flex justify-between">
            <span>Ataque</span>
            <span className="text-red-400">{stats.attack}</span>
          </div>
          <div className="bg-surface-700/30 p-2 rounded flex justify-between">
            <span>Afinidad</span>
            <span className={stats.affinity >= 0 ? "text-green-400" : "text-red-400"}>
              {stats.affinity >= 0 ? '+' : ''}{stats.affinity}%
            </span>
          </div>
          {stats.element && (
            <div className="bg-surface-700/30 p-2 rounded flex justify-between">
              <span>Elemento</span>
              <span className="text-purple-400">{stats.element.type} {stats.element.damage}</span>
            </div>
          )}
          {stats.status && (
            <div className="bg-surface-700/30 p-2 rounded flex justify-between">
              <span>Estado</span>
              <span className="text-amber-400">{stats.status.type} {stats.status.damage}</span>
            </div>
          )}
        </div>
      </div>

      {shareUrl && (
        <div>
          <h3 className="text-lg font-medium mb-2">Enlace compartible</h3>
          <div className="flex gap-2">
            <Input 
              value={shareUrl}
              readOnly
              className="bg-surface-700 border-surface-600"
            />
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                showNotification("success", "Link copiado al portapapeles");
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
    <Card className="bg-surface-800 border-surface-700">
      <CardContent className="p-4">
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
        
        <div className="flex justify-between gap-2">
          <Button 
            variant="default" 
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={handleSave}
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
          
          <Button 
            variant="outline" 
            className="flex-1 border-surface-600"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex-1">
                <Share className="h-4 w-4 mr-2" />
                Compartir
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-surface-800 border-surface-700 text-surface-100">
              <DropdownMenuLabel>Opciones de compartir</DropdownMenuLabel>
              <DropdownMenuItem onClick={generateShareableLink} className="cursor-pointer">
                <Link className="h-4 w-4 mr-2" />
                <span>Enlace</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsJson} className="cursor-pointer">
                <Download className="h-4 w-4 mr-2" />
                <span>Exportar JSON</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={generateImage} className="cursor-pointer">
                <Camera className="h-4 w-4 mr-2" />
                <span>Ver detalles</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>

      {/* Share dialog */}
      <Dialog open={showDialog !== null} onOpenChange={(open) => !open && setShowDialog(null)}>
        <DialogContent className="bg-surface-800 border-surface-700 text-surface-100 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {showDialog === "share" ? "Compartir build" : "Detalles del build"}
              <span className="ml-2 text-primary-400">{buildData.name}</span>
            </DialogTitle>
          </DialogHeader>
          
          {renderBuildSummary()}
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDialog(null)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Volver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}