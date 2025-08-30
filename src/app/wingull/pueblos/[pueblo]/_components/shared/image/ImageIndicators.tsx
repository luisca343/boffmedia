interface ImageIndicatorsProps {
  totalImages: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
  colorClaro: string;
  colorMedio: string;
}

export function ImageIndicators({ 
  totalImages, 
  selectedIndex, 
  onSelect, 
  colorClaro, 
  colorMedio 
}: ImageIndicatorsProps) {
  if (totalImages <= 1) return null;
  
  return (
    <div className="absolute top-4 right-4 z-20">
      <div className="flex gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-sm transition-opacity duration-300 group-hover:opacity-30">
      {Array.from({ length: totalImages }).map((_, index) => (
        <button
        key={index}
          onClick={() => onSelect(index)}
          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
            index === selectedIndex 
            ? 'scale-125' 
            : 'hover:scale-110 opacity-60 hover:opacity-100'
          }`}
          style={{ 
            backgroundColor: index === selectedIndex ? colorClaro : '#9CA3AF'
          }}
          aria-label={`Imagen ${index + 1}`}
        />
      ))}
      </div>
    </div>
  );
}
