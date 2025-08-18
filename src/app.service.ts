import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggingUtil } from './_utils/LoggingUtils';

import { google, sheets_v4 } from 'googleapis';

import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { PokemonDataManagementService } from '@api/smartrotom/pokemon/services/pokemon-data-management.service';

@Injectable()
export class AppService {
  private imageCache: { [key: string]: string } = {};
  private readonly RATE_LIMIT_DELAY = 1000; // 1 second delay between requests
  private readonly CACHE_FILE_PATH = path.join(
    process.cwd(),
    'public/data/imageCache.json',
  );

  constructor(
    private configService: ConfigService,
    private pokemonService: PokemonDataManagementService,
  ) {
    this.loadCache();
  }

  getDBPort(): number {
    return this.configService.get<number>('DB_PORT');
  }

  uploadFile(file: Express.Multer.File) {
    console.log(file);
  }

  toggleLogging() {
    return LoggingUtil.getInstance().toggleLogging();
  }

  async blogicons() {
    const iconsFolderPath = path.join(process.cwd(), 'public/blog', 'icons');
    try {
      const files = await fs.readdir(iconsFolderPath);
      const filesObj = files.reduce((acc, file) => {
        acc[file.split('.')[0]] = `https://api.boffmedia.es/blog/icons/${file}`;
        return acc;
      }, {});
      return filesObj;
    } catch (error) {
      console.error('Error reading the icons folder:', error);
      return []; // Return an empty array in case of an error
    }
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async saveCache() {
    try {
      await fs.writeFile(
        this.CACHE_FILE_PATH,
        JSON.stringify(this.imageCache, null, 2),
      );
      console.log('Cache saved to file.');
    } catch (error) {
      console.error('Error saving cache to file:', error);
    }
  }

  private async loadCache() {
    try {
      const data = await fs.readFile(this.CACHE_FILE_PATH, 'utf-8');
      this.imageCache = JSON.parse(data);
      console.log('Cache loaded from file.');
    } catch (error) {
      console.error('Error loading cache from file:', error);
    }
  }

  async steamKeys() {
    const auth = new google.auth.GoogleAuth({
      keyFile: 'boffmedia-a39cdd7a63c7.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const client = (await auth.getClient()) as any;
    const sheets = google.sheets({
      version: 'v4',
      auth: client,
    }) as sheets_v4.Sheets;

    const spreadsheetId = '1mQopLvsmDuz5iHJ9WVN5NLH78UsKrK6E364v3i8a00c';
    const range = 'A2:F';
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    const steamKeys = await Promise.all(
      rows.map(async (row) => {
        const steamID = row[5];
        let imageUrl = '';

        if (steamID) {
          imageUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${steamID}/header.jpg`;
        } else {
          imageUrl = '/img/steam.webp';
        }

        return {
          name: row[0],
          source: row[1],
          claimed: row[3],
          steamID,
          imageUrl,
        };
      }),
    );

    return steamKeys;
  }

  async getSteamData(steamID: string): Promise<GameData> {
    const url = `https://store.steampowered.com/api/appdetails?appids=${steamID}&l=spanish`;
    const response = await axios.get(url);
    const gameData = response.data[steamID].data;

    const initialPrice = gameData.price_overview?.initial;
    const finalPrice = gameData.price_overview?.final;

    const initialFormatted = initialPrice ? `${initialPrice / 100} €` : 'N/A';
    const finalFormatted = finalPrice ? `${finalPrice / 100} €` : 'N/A';

    const trailers = gameData.movies || [] as Video[];
    const screenshots = gameData.screenshots || [] as Image[];

    const media = [...trailers, ...screenshots] as (Video | Image)[];

    const data = {
      steamID,
      name: gameData.name,
      normalPrice: initialFormatted,
      currentPrice: finalFormatted,
      discountPercent: gameData.price_overview?.discount_percent || 0,
      trailerImages:
        gameData.movies?.map((movie: any) => movie.webm['480']) || [],
      genres: gameData.genres?.map((genre: any) => genre.description) || [],
      description: gameData.detailed_description,
      shortDescription: gameData.short_description,
      headerImage: gameData.header_image,
      screenshots:
        gameData.screenshots?.map((screenshot: any) => screenshot.path_full) ||
        [],
      releaseDate: gameData.release_date?.date,
      developers: gameData.developers || [],
      publishers: gameData.publishers || [],
      platforms: gameData.platforms || {
        windows: false,
        mac: false,
        linux: false,
      },
      categories:
        gameData.categories?.map((category: any) => category.description) || [],
      website: gameData.website || '',

      media: media,
    };

    return data;
  }
}

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
    '480': string;
    max: string;
  };

  mp4: {
    '480': string;
    max: string;
  };

  highlight: boolean;
}

export interface GameData {
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
