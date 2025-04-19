import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  loading: boolean;
  message?: string;
}

export function LoadingOverlay({ loading, message = "Actualizando inventario..." }: LoadingOverlayProps) {
  if (!loading) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg border-2 border-cyan-500/30 flex items-center gap-3">
        <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
        <span className="text-white font-bold">{message}</span>
      </div>
    </div>
  );
}