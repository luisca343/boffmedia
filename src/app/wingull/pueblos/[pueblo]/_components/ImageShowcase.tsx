import Image from "next/image";
import React, { useEffect } from "react";
import { motion } from "framer-motion";

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
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (images.length <= 1) return;
      
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onImageSelect(selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        onImageSelect(selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, images.length, onImageSelect]);

  const handlePrevious = () => {
    onImageSelect(selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1);
  };

  const handleNext = () => {
    onImageSelect(selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0);
  };

  const handleDotClick = (index: number) => {
    onImageSelect(index);
  };

  if (!images.length) {
    return null;
  }

  return (
    <div className={`relative w-full ${className} rounded-xl overflow-hidden shadow-md group`}>
      {/* Carousel container */}
      <div className="relative w-full h-full overflow-hidden">
        <motion.div
          className="flex h-full"
          animate={{
            x: `-${selectedImageIndex * 100}%`
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8
          }}
          drag="x"
          dragConstraints={{
            left: -(images.length - 1) * 100,
            right: 0
          }}
          dragElastic={0.1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipeThreshold = 50;
            const velocityThreshold = 500;
            
            if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > velocityThreshold) {
              if (offset.x > 0 && selectedImageIndex > 0) {
                handlePrevious();
              } else if (offset.x < 0 && selectedImageIndex < images.length - 1) {
                handleNext();
              }
            }
          }}
        >
          {images.map((image, index) => (
            <div key={index} className="w-full h-full flex-shrink-0 relative">
              <Image
                src={image}
                alt={`${alt} ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={index === selectedImageIndex}
              />
            </div>
          ))}
        </motion.div>
      </div>
      
      {/* Simple overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      
      {/* Navigation dots and arrows */}
      {images.length > 1 && showNavigation && (
        <>
          {/* Dots indicator */}
                <div className="absolute top-4 right-4 z-20">
                  <div className="flex gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-sm transition-opacity duration-300 group-hover:opacity-30">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handleDotClick(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                          index === selectedImageIndex 
                            ? 'scale-125' 
                            : 'hover:scale-110 opacity-60 hover:opacity-100'
                        }`}
                        style={{ 
                          backgroundColor: index === selectedImageIndex ? colorClaro : '#9CA3AF'
                        }}
                      />
                    ))}
                  </div>
                </div>

          {/* Navigation arrows */}
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-sm"
          >
            <span style={{ color: colorMedio }}>←</span>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-sm"
          >
            <span style={{ color: colorMedio }}>→</span>
          </button>
        </>
      )}

      {/* Overlay content with fade effect on hover */}
      {overlayContent && (
        <div className="absolute inset-0 transition-all duration-300 group-hover:opacity-30 group-hover:pointer-events-none z-10">
          {overlayContent}
        </div>
      )}
    </div>
  );
}