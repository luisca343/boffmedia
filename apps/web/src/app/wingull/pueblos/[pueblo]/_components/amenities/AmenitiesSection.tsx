import { useTranslations } from "next-intl";
import { TownData } from "../../types";
import { SectionHeader } from "../shared/section/SectionHeader";
import { AmenityCard } from "./AmenityCard";
import { SectionTemplate } from "../shared/section/SectionTemplate";

interface AmenitiesSectionProps {
  townData: TownData;
  townName: string;
}

export function AmenitiesSection({ townData, townName }: AmenitiesSectionProps) {
  const t = useTranslations("wingull.amenities");
  const { colorClaro, colorMedio, colorOscuro, comodidades, nombre } = townData.textos;

  if (!comodidades?.length) return null;

  return (
    <SectionTemplate
      colorClaro={colorClaro}
      colorMedio={colorMedio}
      colorOscuro={colorOscuro}
      backgroundGradient="bg-gradient-to-br from-layer-3 to-layer-2"
      showTopWave={true}
      showBottomWave={true}
    >
      
      <div className="absolute left-0 right-0 top-0 z-20 pointer-events-none" style={{height: '80px'}}>
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="100%" height="80">
          <path d="M0,40 C480,0 960,80 1440,40 L1440,0 L0,0 Z" fill={colorClaro} opacity="1" />
          <path d="M0,60 C480,20 960,100 1440,60 L1440,0 L0,0 Z" fill={colorMedio} opacity="0.7" />
        </svg>
      </div>

      <div className="max-w-[80%] mx-auto">
        <SectionHeader
          title={<span style={{color: colorClaro}}>{t("titlePrimary")}</span>}
          subtitle={<span style={{color: colorMedio}}>{t("titleAccent")}</span>}
          description={<span>{t("description", { town: nombre })}</span>}
          townName={nombre}
          colorClaro={colorClaro}
          colorMedio={colorMedio}
          colorOscuro={colorOscuro}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {comodidades.map((amenity) => (
            <AmenityCard 
              key={amenity.id}
              amenity={amenity}
              colorClaro={colorClaro}
              colorMedio={colorMedio}
              colorOscuro={colorOscuro}
            />
          ))}
        </div>

        
      <div className="absolute left-0 right-0 bottom-0 z-20 pointer-events-none" style={{height: '80px'}}>
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="100%" height="80">
          <path d="M0,40 C480,80 960,0 1440,40 L1440,80 L0,80 Z" fill={colorMedio} opacity="0.08" />
          <path d="M0,65 C480,75 960,45 1440,65 L1440,80 L0,80 Z" fill={colorOscuro} opacity="0.05" />
        </svg>
      </div>

      </div>
    </SectionTemplate>
  );
}