import { getIconComponent } from "../../utils";
import { Amenity } from "../../types";
import { ImageShowcase } from "../shared/image/ImageShowcase";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { BasicCard } from "../shared/cards/BasicCard";
import { OrnamentalDots } from "../shared/decorative/OrnamentalDots";

interface AmenityCardProps {
  amenity: Amenity;
  colorClaro: string;
  colorMedio: string;
  colorOscuro: string;
}

export function AmenityCard({ amenity, colorClaro, colorMedio, colorOscuro }: AmenityCardProps) {
  const t = useTranslations("wingull.amenities");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const IconComponent = getIconComponent(amenity.icon);
  
  // Process images with proper path
  const amenityImages = amenity.images?.map(img => 
    require('path').join('/smartrotom/data/pueblos', img)
  ) || [];
  
  return (
    <BasicCard
      colorClaro={colorClaro}
      colorMedio={colorMedio}
      colorOscuro={colorOscuro}
      className="h-full"
    >
      <div className="relative p-6 h-full flex flex-col">
          {/* Image section using ImageShowcase */}
          {amenityImages.length > 0 && (
            <div className="mb-6">
              <ImageShowcase
                images={amenityImages}
                selectedImageIndex={selectedImageIndex}
                onImageSelect={setSelectedImageIndex}
                alt={amenity.name}
                colorClaro={colorClaro}
                colorMedio={colorMedio}
                colorOscuro={colorOscuro}
                className="h-48"
                overlayContent={
                  <div className="absolute top-3 left-3">
                    <div 
                      className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border shadow-sm"
                      style={{ borderColor: `${colorMedio}30` }}
                    >
                      <IconComponent className="w-5 h-5" style={{ color: colorMedio }} />
                    </div>
                  </div>
                }
              />
            </div>
          )}
          
          {/* Header section with clean styling */}
          <div className="flex items-start gap-4 mb-6">
            {amenityImages.length === 0 && (
              <div 
                className="p-4 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border shadow-sm transition-all duration-300 group-hover:scale-105" 
                style={{ borderColor: `${colorMedio}30` }}
              >
                <IconComponent className="w-8 h-8" style={{ color: colorMedio }} />
              </div>
            )}
            
            <div className="flex-1">
              <h3 className="text-xl lg:text-2xl font-bold mb-2 text-white">
                {amenity.name}
              </h3>
              
              {/* Decorative line under title using town colors */}
              <div className="flex items-center gap-2 mb-2">
                <div className="h-0.5 flex-1 bg-white/20 rounded-full" />
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorClaro }} />
                <div className="h-0.5 w-6 bg-white/20 rounded-full" />
              </div>
            </div>
          </div>
          
          {/* Description with clean typography */}
          <div className="mb-6 flex-1">
            <p className="text-base leading-relaxed text-slate-200">
              {amenity.descripcion}
            </p>
          </div>
          
          {/* Features list with clean design */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider" style={{color: colorMedio}}>
              {t("features")}
            </h4>
            <div className="space-y-2">
              {amenity.caracteristicas.map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 p-2 rounded-lg bg-white/10 transition-all duration-200 hover:bg-white/20"
                >
                  {/* Clean bullet point with town color */}
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: colorMedio }} 
                  />
                  
                  <span className="text-slate-200 text-sm font-medium">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Bottom decorative element using town colors */}
          <div className="flex justify-center mt-6 pt-4 border-t border-white/10">
            <OrnamentalDots
              colorClaro={colorClaro}
              colorMedio={colorMedio}
              colorOscuro={colorOscuro}
              size="large"
            />
          </div>
        </div>
      </BasicCard>
  );
}