import { TownData } from "../../types";
import { SectionHeader } from "../shared/section/SectionHeader";
import { SectionTemplate } from "../shared/section/SectionTemplate";
import { MapWithDetails } from "./MapWithDetails";

interface TownMapSectionProps {
  townData: TownData;
  townName: string;
}

export function TownMapSection({ townData, townName }: TownMapSectionProps) {
  const { colorClaro, colorMedio, colorOscuro, coordenadas, parcelas, negocios, nombre } = townData.textos;

  // Check if we have coordinates to show the map
  const hasCoordinates = coordenadas || 
    parcelas.some(p => p.coordenadas) || 
    negocios.some(b => b.coordenadas);

  if (!hasCoordinates) {
    return null;
  }

  return (
    <SectionTemplate
      colorClaro={colorClaro}
      colorMedio={colorMedio}
      colorOscuro={colorOscuro}
      backgroundGradient="bg-gradient-to-bl from-surface-800 to-surface-600"
    >

      <div className="absolute left-0 right-0 top-0 z-20 pointer-events-none" style={{height: '80px'}}>
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="100%" height="80">
          <path d="M0,40 C480,0 960,80 1440,40 L1440,0 L0,0 Z" fill={colorClaro} opacity="0.08" />
          <path d="M0,60 C480,20 960,100 1440,60 L1440,0 L0,0 Z" fill={colorMedio} opacity="0.05" />
        </svg>
      </div>

      <SectionHeader
        title={<span style={{color: colorClaro}}>Mapa</span>}
        subtitle={<span style={{color: colorMedio}}>Interactivo</span>}
        description={<span>Explora la ubicación de las parcelas disponibles en {nombre} y navega por el territorio</span>}
        townName={nombre}
        colorClaro={colorClaro}
        colorMedio={colorMedio}
        colorOscuro={colorOscuro}
      />
      
      <MapWithDetails
        townData={townData}
        townName={nombre}
        colorClaro={colorClaro}
        colorMedio={colorMedio}
        colorOscuro={colorOscuro}
      />
    </SectionTemplate>
  );
}
