"use client";

import { useState, useEffect } from "react";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Moon,
  Sunset,
  RefreshCw,
} from "lucide-react";
import useGetWeather from "./_hooks/useGetWeather";

export default function Component() {
  const { weatherData, timeLeft, minecraftTime, refreshWeather } = useGetWeather();

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatMinecraftTime = (ticks: number): string => {
    const totalMinutes = Math.floor(ticks / 20);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const getDaySection = (ticks: number): string => {
    if (ticks >= 0 && ticks < 12000) return "Día";
    if (ticks >= 12000 && ticks < 13000) return "Atardecer";
    if (ticks >= 13000 && ticks < 23000) return "Noche";
    if (ticks >= 23000 && ticks < 24000) return "Amanecer";
    return "Desconocido";
  };

  const getWeatherIcon = (weather: string): JSX.Element => {
    switch (weather) {
      case "nublado":
        return <Cloud className="h-12 w-12 text-text-tertiary" />;
      case "lluvia":
        return <CloudRain className="h-12 w-12 text-blue-500" />;
      case "tormenta":
        return <CloudLightning className="h-12 w-12 text-purple-500" />;
      case "noche":
        return <Moon className="h-12 w-12 text-indigo-300" />;
      default:
        return <Sun className="h-12 w-12 text-yellow-500" />;
    }
  };

  return (
    <div className="w-full max-w-[300px] bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-blue-500 p-3 flex justify-between items-center">
        <h2 className="text-white text-lg font-semibold">Clima de Minecraft</h2>
        <button
          onClick={refreshWeather}
          className="text-white hover:bg-blue-600 rounded-full p-1"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          {getWeatherIcon(weatherData.weather)}
          <div className="text-right">
            <p className="text-2xl font-bold text-text-tertiary capitalize">
              {weatherData.weather}
            </p>
            <p className="text-sm text-text-tertiary">
              Cambia en: {formatTime(timeLeft)}
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-text-tertiary">Hora del juego</p>
            <p className="text-lg font-semibold text-text-tertiary">
              {formatMinecraftTime(minecraftTime)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-tertiary">Sección</p>
            <p className="text-lg font-semibold text-text-tertiary">
              {getDaySection(minecraftTime)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}