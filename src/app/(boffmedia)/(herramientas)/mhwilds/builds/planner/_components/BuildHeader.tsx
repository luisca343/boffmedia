import { Shield, Save, Share2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BuildHeaderProps {
  buildName: string;
  onBuildNameChange: (name: string) => void;
}

export function BuildHeader({ buildName, onBuildNameChange }: BuildHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <Shield className="mr-2 h-6 w-6 text-green-400 hidden sm:block" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-surface-50">
              Planificador de Builds
            </h1>
            <p className="text-surface-300 text-sm mt-1">
              Crea y optimiza tus builds para Monster Hunter Wilds
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Input
            value={buildName}
            onChange={(e) => onBuildNameChange(e.target.value)}
            className="max-w-[250px] bg-surface-700 border-surface-600"
            placeholder="Nombre de la build"
          />
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="text-green-400 border-green-500">
              <Save className="mr-1 h-4 w-4" /> Guardar
            </Button>
            <Button variant="outline" size="sm" className="text-surface-300">
              <Share2 className="mr-1 h-4 w-4" /> Compartir
            </Button>
            <Button variant="outline" size="sm" className="text-surface-300">
              <RefreshCw className="mr-1 h-4 w-4" /> Reiniciar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}