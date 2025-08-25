// Types for TownRealEstatePage

export interface TownCoordinates {
  inicio: { x: number; z: number };
  fin: { x: number; z: number };
}

export interface TownData {
  textos: {
    color?: string; // keep for legacy
    colorClaro: string;
    colorMedio: string;
    colorOscuro: string;
    frasebonita: string;
    descripcion: string;
    coordenadas?: TownCoordinates;
    comodidades: Amenity[];
    parcelas: Property[];
  };
  fondo?: string;
  images?: string[];
}

export interface Amenity {
  id: string;
  name: string;
  descripcion: string;
  icon: string;
  images?: string[];
  caracteristicas: string[];
  coordenadas?: { x: number; z: number };
}

export interface Property {
  id: number;
  name: string;
  info: string;
  detalle: string;
  caracteristicas: string[];
  comodidadesCercanas: string[];
  images?: string[];
  coordenadas?: { x: number; z: number };
}
