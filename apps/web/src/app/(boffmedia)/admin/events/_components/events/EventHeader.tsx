import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Plus, Search, Calendar } from "lucide-react";

interface EventHeaderProps {
  totalEvents: number;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onCreateNew: () => void;
}

export function EventHeader({ totalEvents, searchTerm, onSearchChange, onCreateNew }: EventHeaderProps) {
  return (
    <div className="p-6 space-y-5">
      {/* Title row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(249,115,22,0.08)",
              border: "1px solid rgba(249,115,22,0.22)",
            }}
          >
            <Calendar className="w-4 h-4" style={{ color: "rgb(251,146,60)" }} />
          </div>
          <div>
            <h2
              className="text-base font-black text-surface-50 leading-none"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Gestión de Eventos
            </h2>
            <p className="text-[11px] font-mono text-surface-600 mt-0.5 uppercase tracking-wider">
              Administra eventos y competiciones
            </p>
          </div>
        </div>

        <Button size="sm" onClick={onCreateNew} className="gap-1.5 flex-shrink-0">
          <Plus className="w-3.5 h-3.5" />
          Nuevo Evento
        </Button>
      </div>

      {/* Search + count row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: "rgba(249,115,22,0.5)" }}
          />
          <Input
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm bg-surface-900 border-surface-700/60 text-surface-100 focus:border-primary-500/40"
          />
        </div>

        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-widest flex-shrink-0"
          style={{
            color: "rgba(249,115,22,0.8)",
            border: "1px solid rgba(249,115,22,0.22)",
            background: "rgba(249,115,22,0.06)",
          }}
        >
          {totalEvents} evento{totalEvents !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
