"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("tiempo");
  const { weatherData, minecraftTime, refreshWeather } = useGetWeather();

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
    if (ticks >= 0 && ticks < 12000) return t("daySections.day");
    if (ticks >= 12000 && ticks < 13000) return t("daySections.sunset");
    if (ticks >= 13000 && ticks < 23000) return t("daySections.night");
    if (ticks >= 23000 && ticks < 24000) return t("daySections.dawn");
    return t("daySections.unknown");
  };

  const getWeatherIcon = (weather: string): React.JSX.Element => {
    switch (weather) {
      case "nublado":
        return <Cloud className="h-12 w-12 text-ink-muted" />;
      case "lluvia":
        return <CloudRain className="h-12 w-12 text-secondary" />;
      case "tormenta":
        return <CloudLightning className="h-12 w-12 text-secondary" />;
      case "noche":
        return <Moon className="h-12 w-12 text-indigo-300" />;
      default:
        return <Sun className="h-12 w-12 text-yellow-500" />;
    }
  };

  const getWeatherLabel = (weather: string): string => {
    switch (weather) {
      case "nublado": return t("weather.cloudy");
      case "lluvia": return t("weather.rain");
      case "tormenta": return t("weather.storm");
      case "noche": return t("weather.night");
      default: return t("weather.clear");
    }
  };

  return (
    <div className="w-full max-w-[300px] bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-secondary p-3 flex justify-between items-center">
        <h2 className="text-white text-lg font-semibold">{t("title")}</h2>
        <button
          onClick={refreshWeather}
          className="text-white hover:bg-secondary-active rounded-full p-1"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          {getWeatherIcon(weatherData.weather)}
          <div className="text-right">
            <p className="text-2xl font-bold text-ink-dim capitalize">
              {getWeatherLabel(weatherData.weather)}
            </p>
            <p className="text-sm text-ink-dim">
              {t("changesIn", { time: formatTime(weatherData.changeTime) })}
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-ink-dim">{t("gameTime")}</p>
            <p className="text-lg font-semibold text-ink-dim">
              {formatMinecraftTime(minecraftTime)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-ink-dim">{t("daySection")}</p>
            <p className="text-lg font-semibold text-ink-dim">
              {getDaySection(minecraftTime)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}