import { useState } from "react";
import axios from "axios";
import { apiGET } from "@/services/boffAPI";

export interface Image {
  id: number;
  path_thumbnail: string;
  path_full: string;
}

export interface Video {
  id: number;
  name: string;
  thumbnail: string;
  webm: {
    "480": string;
    max: string;
  };

  mp4: {
    "480": string;
    max: string;
  };

  highlight: boolean;
}

export interface SteamGame {
  name: string;
  normalPrice: string;
  currentPrice: string;
  discountPercent: number;
  trailerImages: string[];
  genres: string[];
  description: string;
  shortDescription: string;
  headerImage: string;
  screenshots: string[];
  releaseDate: string;
  developers: string[];
  publishers: string[];
  platforms: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  categories: string[];
  website: string;

  media: (Video | Image)[];
}

const useFetchSteamData = () => {
  const [selectedGame, setSelectedGame] = useState<SteamGame | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const fetchGameData = async (steamID: string) => {
    try {
      const response = await apiGET(`/steamdata/${steamID}`);
      const gameData = response;

      setSelectedGame(gameData);
      setIsModalVisible(true);
    } catch (error) {
      console.error("Error fetching game data:", error);
    }
  };

  return {
    selectedGame,
    isModalVisible,
    setIsModalVisible,
    fetchGameData,
  };
};

export default useFetchSteamData;
