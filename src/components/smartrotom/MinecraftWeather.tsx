"use client";
import { RefreshCw } from "lucide-react";
import useGetWeather from "@/app/smartrotom/tiempo/_hooks/useGetWeather";
import {
  getWeatherIcon,
  getDayNightIcon,
  formatMinecraftTime,
  getDaySection,
  getWeatherName,
} from "@/lib/minecraftWeather";

export default function MinecraftWeatherWidget() {
  const { weatherData, minecraftTime, refreshWeather } =
    useGetWeather();

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full min-w-[460px]  bg-white bg-opacity-80 rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-blue-500 p-3 flex justify-between items-center">
        <h2 className="text-white text-lg font-semibold">El tiempo en Teras</h2>
        <button
          onClick={refreshWeather}
          className="text-white hover:bg-blue-600 rounded-full p-1"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getDayNightIcon(minecraftTime)}
            <div>
              <p className="text-lg font-semibold text-surface-800">
                {formatMinecraftTime(minecraftTime)}
              </p>
              <p className="text-sm text-surface-600">
                {getDaySection(minecraftTime)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <p className="text-md font-bold text-surface-800 capitalize">
              {getWeatherName(weatherData.weather)}
            </p>
            {getWeatherIcon(weatherData.weather)}
          </div>
          <div className="text-right">
            <p className="text-sm text-surface-600">{
              weatherData.weather == "clear" ? "Lluvia prevista en" : "Despejado en"
              }</p>
            <p className="text-lg font-semibold text-surface-800">
              {formatTime(weatherData.timeUntilChange)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
