// Types for TownRealEstatePage

export interface TownData {
  textos: {
    color?: string; // keep for legacy
    colorClaro: string;
    colorMedio: string;
    colorOscuro: string;
    frasebonita: string;
    descripcion: string;
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
  image?: string;
  caracteristicas: string[];
}

export interface Property {
  id: number;
  name: string;
  info: string;
  detalle: string;
  caracteristicas: string[];
  comodidadesCercanas: string[];
  images?: string[];
}
