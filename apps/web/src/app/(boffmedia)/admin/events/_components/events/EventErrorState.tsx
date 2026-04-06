import { Button } from "@/components/ui";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface EventErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function EventErrorState({ error, onRetry }: EventErrorStateProps) {
  return (
    <div
      className="rounded-xl border p-12 flex flex-col items-center text-center"
      style={{
        background: "rgba(9,13,27,0.85)",
        borderColor: "rgba(239,68,68,0.2)",
      }}
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
        style={{
          background: "rgba(239,68,68,0.07)",
          border: "1px solid rgba(239,68,68,0.22)",
        }}
      >
        <AlertTriangle className="w-7 h-7" style={{ color: "rgba(239,68,68,0.8)" }} />
      </div>

      <h3
        className="text-sm font-black text-surface-200 mb-1.5"
        style={{ fontFamily: "Orbitron, sans-serif" }}
      >
        Error al cargar eventos
      </h3>
      <p className="text-xs text-surface-500 max-w-xs leading-relaxed mb-6">{error}</p>

      <Button size="sm" onClick={onRetry} className="gap-1.5">
        <RefreshCw className="w-3.5 h-3.5" />
        Reintentar
      </Button>
    </div>
  );
}
