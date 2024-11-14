"use client";

import { Hora } from "@/components/Hora";
import useGetWeather from "@/app/smartrotom/tiempo/_hooks/useGetWeather";
import {
  getDayNightIcon,
  getDaySection,
  getWeatherIcon,
  getWeatherName,
} from "@/lib/minecraftWeather";
import { mcTimeToRealTime, mcTimeToRealTimeWithExtraDays } from "@/lib/utils";

export default function ClickableClock() {
  const { weatherData, minecraftTime, changeTime } = useGetWeather();

  return (
    <div className="w-full cursor-pointer flex items-center justify-center">
      <div className="flex flex-col text-shadow-border1 bg-white bg-opacity-40 backdrop-blur-sm rounded-xl p-4 shadow-md transition-all duration-300 ease-in-out hover:bg-opacity-60">
        <div className="flex flex-col items-center sm:items-end">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              {getDayNightIcon(minecraftTime)}
              <span className="text-white text-lg sm:text-xl font-semibold">
                {getDaySection(minecraftTime)}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-white text-lg sm:text-xl font-semibold">
                {getWeatherName(weatherData.weather)}
              </span>
              {getWeatherIcon(weatherData.weather)}
            </div>
          </div>
        </div>
        <div className="text-white text-4xl sm:text-5xl lg:text-6xl text-center text-shadow-border3 my-1">
          {mcTimeToRealTime(minecraftTime)}
        </div>
        <div className="text-white text-sm sm:text-lg text-center font-semibold">
          {weatherData.weather === "clear"
            ? "Lluvia prevista a las "
            : "Despejado a las "}
          {mcTimeToRealTimeWithExtraDays(changeTime)}
        </div>
      </div>
    </div>
  );
}
