"use client";

import { Hora } from "@/components/Hora";
import useGetWeather from "@/app/smartrotom/tiempo/_hooks/useGetWeather";
import {
  getDayNightIcon,
  getWeatherIcon,
  getWeatherName,
} from "@/lib/minecraftWeather";
import { mcTimeToRealTime } from "@/lib/utils";

export default function ClickableClock() {
  const { weatherData, minecraftTime, changeTime } = useGetWeather();
  
  return (
    <div className="w-full cursor-pointer flex items-center justify-center">
      <div className="flex flex-col text-shadow-main-border1 bg-white bg-opacity-40 backdrop-blur-sm rounded-xl p-4 shadow-md transition-all duration-300 ease-in-out hover:bg-opacity-60">
        <Hora className="text-main-50 text-4xl sm:text-5xl lg:text-6xl text-center text-shadow-main-border3 mb-2" />
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-1">
            {getDayNightIcon(minecraftTime)}
            <span className="text-main-50 text-xl sm:text-2xl font-semibold">
              {mcTimeToRealTime(minecraftTime)}
            </span>
          </div>
          <div className="flex flex-col items-center sm:items-end">
            <div className="flex items-center space-x-1">
              <span className="text-main-50 text-lg sm:text-xl font-semibold">
                {getWeatherName(weatherData.weather)}
              </span>
              {getWeatherIcon(weatherData.weather)}
            </div>
          </div>
        </div>
        <div className="text-main-50 text-sm sm:text-md text-center mt-2">
          {weatherData.weather === "clear"
            ? "Lluvia prevista a las "
            : "Despejado a las "}
          {mcTimeToRealTime(changeTime)}
        </div>
      </div>
    </div>
  );
}
