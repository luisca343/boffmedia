import { Button } from "@/components/ui/button";
import { Calendar, Search, Sparkles } from "lucide-react";

interface EventsEmptyProps {
  searchTerm?: string;
  onClearSearch?: () => void;
}

export function EventsEmpty({ searchTerm, onClearSearch }: EventsEmptyProps) {
  return (
    <div className="py-20 text-center relative">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 right-1/4 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10">
        {/* Icon */}
        <div className="relative inline-block mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto border border-purple-500/20">
            {searchTerm ? (
              <Search className="h-12 w-12 text-purple-400" />
            ) : (
              <Calendar className="h-12 w-12 text-purple-400" />
            )}
          </div>
          
          {/* Floating sparkles */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center animate-bounce">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full animate-pulse"></div>
        </div>

        {/* Title and Description */}
        <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
          {searchTerm ? 'Sin resultados' : 'No hay eventos'}
        </h3>
        
        <p className="max-w-md mx-auto text-surface-300 mb-8 leading-relaxed">
          {searchTerm
            ? `No encontramos eventos que coincidan con "${searchTerm}". Prueba con otros términos de búsqueda.`
            : "No hay eventos disponibles en este momento. ¡Vuelve pronto para descubrir nuevas aventuras épicas!"}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {searchTerm && onClearSearch && (
            <Button 
              variant="outline" 
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 px-6"
              onClick={onClearSearch}
            >
              <Search className="w-4 h-4 mr-2" />
              Limpiar búsqueda
            </Button>
          )}
          
          <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-6">
            <Calendar className="w-4 h-4 mr-2" />
            Explorar eventos
          </Button>
        </div>

        {/* Decorative elements */}
        <div className="mt-12 flex justify-center gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-purple-400/30 rounded-full animate-ping"
              style={{
                animationDelay: `${i * 0.5}s`,
                animationDuration: '2s'
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}