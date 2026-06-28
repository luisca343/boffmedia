import { Button } from "@/components/ui/primitives/button";
import { Calendar, Search } from "lucide-react";

interface EventsEmptyProps {
  searchTerm?: string;
  onClearSearch?: () => void;
}

export function EventsEmpty({ searchTerm, onClearSearch }: EventsEmptyProps) {
  const Icon = searchTerm ? Search : Calendar;

  return (
    <div
      className="rounded-xl border p-16 text-center"
      style={{
        background: "rgba(9,13,27,0.85)",
        borderColor: "rgba(249,115,22,0.15)",
      }}
    >
      {/* Icon */}
      <div
        className="w-20 h-20 rounded-xl flex items-center justify-center mx-auto mb-6"
        style={{
          background: "rgba(249,115,22,0.07)",
          border: "1px solid rgba(249,115,22,0.2)",
        }}
      >
        <Icon className="w-9 h-9" style={{ color: "rgb(251,146,60)" }} />
      </div>

      <h3
        className="text-xl font-black text-ink mb-2"
        style={{ fontFamily: "Orbitron, sans-serif" }}
      >
        {searchTerm ? "Sin resultados" : "No hay eventos"}
      </h3>

      <p className="text-sm text-ink-muted max-w-sm mx-auto mb-8 leading-relaxed">
        {searchTerm
          ? `No encontramos eventos que coincidan con "${searchTerm}".`
          : "No hay eventos disponibles en este momento. ¡Vuelve pronto!"}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
        <Button variant="accent" size="sm">
          <Calendar className="w-3.5 h-3.5 mr-1.5" />
          Explorar eventos
        </Button>
      </div>

      {/* Decorative dots */}
      <div className="mt-10 flex justify-center gap-2">
        {[0, 0.5, 1].map((delay, i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "rgba(249,115,22,0.3)", animationDelay: `${delay}s` }}
          />
        ))}
      </div>
    </div>
  );
}
