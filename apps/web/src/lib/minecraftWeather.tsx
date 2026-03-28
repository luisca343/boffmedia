import React from "react";
import {
  Sun,
  CloudRain,
  CloudLightning,
  Moon,
  Sunset,
  SunMoon,
  Sunrise,
  Cloud,
} from "lucide-react";

export const getWeatherIcon = (weather: string): React.JSX.Element => {
  switch (weather) {
    case "rain":
      return <CloudRain className="h-8 w-8 text-secondary-500" />;
    case "storm":
      return <CloudLightning className="h-8 w-8 text-accent-500" />;
    default:
      return <SunMoon className="h-8 w-8 text-yellow-500" />;
  }
};

export const getDayNightIcon = (ticks: number): React.JSX.Element => {
  if ((ticks >= 22500 && ticks < 24000) || (ticks >= 0 && ticks < 300)) return <Sunrise className="h-6 w-6 text-primary-500" />;
  if ((ticks >= 300 && ticks < 6000)) return <Sun className="h-6 w-6 text-yellow-300" />;
  if (ticks >= 5500 && ticks < 6500) return <Sun className="h-6 w-6 text-yellow-500" />;
  if (ticks >= 6000 && ticks < 12000) return <Sun className="h-6 w-6 text-yellow-600" />;
  if (ticks >= 12000 && ticks < 13800) return <Sunset className="h-6 w-6 text-primary-500" />;
  if (ticks >= 13450 && ticks < 22550) return <Moon className="h-6 w-6 text-indigo-300" />;
  if (ticks >= 17500 && ticks < 18500) return <Moon className="h-6 w-6 text-indigo-400" />;
  return <Cloud className="h-6 w-6 text-surface-400" />;
};

export const formatMinecraftTime = (ticks: number): string => {
  const totalMinutes = Math.floor(ticks / 20);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const getDaySection = (ticks: number): string => {
  if ((ticks >= 22500 && ticks < 24000) || (ticks >= 0 && ticks < 300)) return "Amanecer";
  if ((ticks >= 300 && ticks < 6000)) return "Mañana";
  if (ticks >= 0 && ticks < 12000) return "Día";
  if (ticks >= 5500 && ticks < 6500) return "Mediodía";
  if (ticks >= 6000 && ticks < 12000) return "Tarde";
  if (ticks >= 12000 && ticks < 13800) return "Atardecer";
  if (ticks >= 13450 && ticks < 22550) return "Noche";
  if (ticks >= 17500 && ticks < 18500) return "Medianoche";
  return "Desconocido";
};

export function getWeatherName(weather: string): string {
  switch (weather) {
    case "rain":
      return "Lluvia";
    case "storm":
      return "Tormenta";
    default:
      return "Despejado";
  }
}