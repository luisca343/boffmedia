import { useState, useEffect, useCallback } from "react";
import { terasGET } from "@/services/boffAPI";

interface WeatherData {
  weather: string;
  timeUntilChange: number;
  minecraftTime: number;
}

export default function useGetWeather() {
  const [weatherData, setWeatherData] = useState<WeatherData>({
    weather: "",
    timeUntilChange: 0,
    minecraftTime: 0,
  });
  const [changeTime, setChangeTime] = useState(0);
  const [minecraftTime, setMinecraftTime] = useState(0);

  const fetchWeatherData = useCallback(async () => {
    try {
      const data = (await terasGET("/weather")) as any;
      setWeatherData(data);
      setChangeTime(data.changeTime);
      setMinecraftTime(data.minecraftTime);
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  }, []);

  const refreshWeather = useCallback(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  useEffect(() => {
    fetchWeatherData();

    const timer = setInterval(() => {

      setMinecraftTime((prevTime) => (prevTime + 20) % 24000);
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchWeatherData]);

  return {
    weatherData,
    changeTime,
    minecraftTime,
    refreshWeather,
  };
}