import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Plus } from "lucide-react";

interface SectionEmptyProps {
  title?: string;
  description?: string;
  searchTerm?: string;
  onClearSearch?: () => void;
  onCreateNew?: () => void;
  createNewLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  showCreateButton?: boolean;
}

export function SectionEmpty({ 
  title,
  description,
  searchTerm, 
  onClearSearch,
  onCreateNew,
  createNewLabel = "Crear nuevo",
  icon: Icon,
  className = "",
  showCreateButton = false
}: SectionEmptyProps) {
  const defaultTitle = searchTerm ? 'Sin resultados' : 'No hay elementos';
  const defaultDescription = searchTerm
    ? `No encontramos elementos que coincidan con "${searchTerm}". Prueba con otros términos de búsqueda.`
    : "No hay elementos disponibles en este momento. ¡Vuelve pronto para descubrir nuevas novedades!";

  return (
    <div className={`py-20 text-center relative ${className}`}>
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-32 h-32 bg-accent-500/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 right-1/4 w-40 h-40 bg-secondary-500/5 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10">
        {/* Icon */}
        <div className="relative inline-block mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-accent-600/20 to-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto border border-accent-500/20">
            {Icon ? (
              <Icon className="w-12 h-12 text-accent-400" />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-secondary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">?</span>
              </div>
            )}
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-pink-500 to-accent-600 rounded-full flex items-center justify-center animate-bounce">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-br from-secondary-500 to-cyan-600 rounded-full animate-pulse"></div>
        </div>

        {/* Title and Description */}
        <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-pink-400 mb-4">
          {title || defaultTitle}
        </h3>
        
        <p className="max-w-md mx-auto text-surface-300 mb-8 leading-relaxed">
          {description || defaultDescription}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {searchTerm && onClearSearch && (
            <Button
              onClick={onClearSearch}
              variant="outline"
              className="border-accent-500/30 text-accent-400 hover:bg-accent-500/10 hover:border-accent-500/50 font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Limpiar búsqueda
            </Button>
          )}
          
          {showCreateButton && onCreateNew && (
            <Button
              onClick={onCreateNew}
              variant="accent"
            >
              <Plus className="w-4 h-4 mr-2" />
              {createNewLabel}
            </Button>
          )}
        </div>

        {/* Decorative dots */}
        <div className="mt-12 flex justify-center gap-2">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i}
              className="w-2 h-2 bg-accent-400/30 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
