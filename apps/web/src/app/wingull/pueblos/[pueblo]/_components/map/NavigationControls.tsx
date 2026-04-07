import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NavigationControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  colorClaro: string;
  colorMedio: string;
  disabled?: { prev?: boolean; next?: boolean };
}

export function NavigationControls({ 
  onPrevious, 
  onNext, 
  colorClaro, 
  colorMedio,
  disabled = {}
}: NavigationControlsProps) {
  return (
    <>
      {/* Previous button */}
      <button
        onClick={onPrevious}
        disabled={disabled.prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-sm"
        style={{ borderColor: `${colorClaro}40`, color: colorMedio }}
        aria-label="Imagen anterior"
      >
        <ChevronLeft className="w-4 h-4" />
        </button>

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={disabled.next}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-sm"
        style={{ borderColor: `${colorClaro}40`, color: colorMedio }}
        aria-label="Siguiente imagen"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </>
  );
}
