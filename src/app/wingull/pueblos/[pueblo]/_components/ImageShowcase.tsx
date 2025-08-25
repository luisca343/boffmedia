import Image from "next/image";
import React from "react";

interface ImageShowcaseProps {
  images: string[];
  selectedImageIndex: number;
  onImageSelect: (index: number) => void;
  alt: string;
  colorClaro: string;
  colorMedio: string;
  colorOscuro: string;
  className?: string;
  overlayContent?: React.ReactNode;
  showNavigation?: boolean;
}

export function ImageShowcase({ 
  images, 
  selectedImageIndex, 
  onImageSelect, 
  alt, 
  colorClaro, 
  colorMedio, 
  colorOscuro,
  className = "h-48 lg:h-72",
  overlayContent,
  showNavigation = true
}: ImageShowcaseProps) {
  const currentImage = images[selectedImageIndex] || images[0];

  if (!images.length || !currentImage) {
    return null;
  }

  return (
    <div className={`relative w-full ${className} rounded-xl overflow-hidden shadow-md`}>
      <Image
        src={currentImage}
        alt={alt}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      
      {/* Simple overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      
      {/* Navigation dots and arrows */}
      {images.length > 1 && showNavigation && (
        <>
          {/* Dots indicator */}
          <div className="absolute top-4 right-4 z-20">
            <div className="flex gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-sm transition-opacity duration-300 group-hover:opacity-30">
              {images.slice(0, 4).map((_, index) => (
                <button
                  key={index}
                  onClick={() => onImageSelect(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                    index === selectedImageIndex 
                      ? 'scale-125' 
                      : 'hover:scale-110 opacity-60 hover:opacity-100'
                  }`}
                  style={{ 
                    backgroundColor: index === selectedImageIndex ? colorClaro : '#9CA3AF'
                  }}
                />
              ))}
              {images.length > 4 && (
                <span className="text-gray-600 dark:text-gray-300 text-xs ml-1 font-medium">+{images.length - 4}</span>
              )}
            </div>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={() => onImageSelect(selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-sm"
          >
            <span style={{ color: colorMedio }}>←</span>
          </button>
          <button
            onClick={() => onImageSelect(selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-sm"
          >
            <span style={{ color: colorMedio }}>→</span>
          </button>
        </>
      )}

      {/* Overlay content with fade effect on hover */}
      {overlayContent && (
        <div className="absolute inset-0 transition-all duration-300 group-hover:opacity-30 group-hover:pointer-events-none">
          {overlayContent}
        </div>
      )}
    </div>
  );
}
