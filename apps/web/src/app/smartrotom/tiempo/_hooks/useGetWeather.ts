import { useState, useEffect, useCallback } from "react";
import { WingullService } from "@/services/api/smartrotom/wingullService";
import { Weather } from "@boffmedia/shared";

export default function useGetWeather() {
  const [weatherData, setWeatherData] = useState<Weather>({
    weather: "",
    changeTime: 0,
    minecraftTime: 0,
  });
  const [changeTime, setChangeTime] = useState(0);
  const [minecraftTime, setMinecraftTime] = useState(0);

  const fetchWeatherData = useCallback(async () => {
    try {
      // Only a network error throws; an HTTP error resolves to `{ success: false }` and
      // `data!` would then hand `undefined` to the setters as if it were a Weather.
      const res = await WingullService.getWeather();
      if (!res.success || !res.data) {
        console.error("Error fetching weather data:", res.message || res.error);
        return;
      }
      const data = res.data;

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