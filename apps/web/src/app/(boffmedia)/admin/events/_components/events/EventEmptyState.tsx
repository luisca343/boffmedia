import { Button } from "@/components/ui";
import { Calendar, Search } from "lucide-react";

interface EventEmptyStateProps {
  searchTerm?: string;
  onClearSearch?: () => void;
}

export function EventEmptyState({ searchTerm, onClearSearch }: EventEmptyStateProps) {
  const Icon = searchTerm ? Search : Calendar;

  return (
    <div className="py-14 flex flex-col items-center text-center">
      <div
        className="w-16 h-16 rounded-xl flex items-center justify-center mb-5"
        style={{
          background: "rgba(249,115,22,0.07)",
          border: "1px solid rgba(249,115,22,0.18)",
        }}
      >
        <Icon className="w-7 h-7" style={{ color: "rgba(249,115,22,0.7)" }} />
      </div>

      <h3
        className="text-sm font-black text-surface-200 mb-1.5"
        style={{ fontFamily: "Orbitron, sans-serif" }}
      >
        {searchTerm ? "Sin resultados" : "No hay eventos"}
      </h3>
      <p className="text-xs text-surface-500 max-w-xs leading-relaxed mb-5">
        {searchTerm
          ? `No hay eventos que coincidan con "${searchTerm}".`
          : "No hay eventos registrados. Crea el primer evento para comenzar."}
      </p>

      {searchTerm && onClearSearch && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearSearch}
          style={{ borderColor: "rgba(249,115,22,0.22)", color: "rgb(251,146,60)" }}
        >
          <Search className="w-3.5 h-3.5 mr-1.5" />
          Limpiar búsqueda
        </Button>
      )}
    </div>
  );
}
