import Image from "next/image";
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { NavigationControls } from "../../map/NavigationControls";
import { ImageIndicators } from "./ImageIndicators";

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
          {/* Navigation controls */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <NavigationControls
              onPrevious={handlePrevious}
              onNext={handleNext}
              colorClaro={colorClaro}
              colorMedio={colorMedio}
            />
          </div>

          {/* Image indicators */}
          <ImageIndicators
            totalImages={images.length}
            selectedIndex={selectedImageIndex}
            onSelect={handleDotClick}
            colorClaro={colorClaro}
            colorMedio={colorMedio}
          />
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