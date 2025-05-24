import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

interface EventsEmptyProps {
  searchTerm?: string;
  onClearSearch?: () => void;
}

export function EventsEmpty({ searchTerm, onClearSearch }: EventsEmptyProps) {
  return (
    <div className="py-16 text-center">
      <Calendar className="h-20 w-20 mx-auto mb-6 text-surface-500 opacity-40" />
      <h3 className="text-2xl font-medium text-surface-200 mb-2">No se encontraron eventos</h3>
      <p className="max-w-md mx-auto text-surface-300 mb-6">
        {searchTerm
          ? `No hay eventos que coincidan con "${searchTerm}". Prueba con otros términos de búsqueda.`
          : "No hay eventos disponibles en este momento. Vuelve a consultar más tarde."}
      </p>
      {searchTerm && onClearSearch && (
        <Button variant="outline" className="border-primary-500 text-primary-500" onClick={onClearSearch}>
          Limpiar búsqueda
        </Button>
      )}
    </div>
  );
}