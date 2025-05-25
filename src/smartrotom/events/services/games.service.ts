import { Injectable } from '@nestjs/common';
import { GamesRepository } from '../repositories/games.repository';
import { Game } from '@/_db/schema/Events';
import { CreateGameDto } from '../dto/create-game.dto';

@Injectable()
export class GamesService {
  constructor(
    private readonly gamesRepository: GamesRepository,
  ) {}

  async getAllGames(): Promise<Game[]> {
    return this.gamesRepository.findAll();
  }

  async getGameById(id: number): Promise<Game> {
    return this.gamesRepository.findById(id);
  }

  async createGame(createGameDto: CreateGameDto): Promise<Game> {
    const gameData = {
      title: createGameDto.title,
      description: createGameDto.description,
      icon: createGameDto.icon,
    };

    const result = await this.gamesRepository.create(gameData);
    return this.getGameById(result.insertId);
  }

  async updateGame(id: number, createGameDto: CreateGameDto): Promise<Game> {
    const gameData = {
      title: createGameDto.title,
      description: createGameDto.description,
      icon: createGameDto.icon,
    };

    await this.gamesRepository.update(id, gameData);
    return this.getGameById(id);
  }

  async deleteGame(id: number): Promise<void> {
    // First, soft delete all events associated with this game
    await this.gamesRepository.softDeleteEventsByGame(id);

    // Then soft delete the game
    await this.gamesRepository.softDelete(id);
  }

  async validateGameExists(gameId: number): Promise<boolean> {
    const game = await this.gamesRepository.findById(gameId);
    return !!game;
  }
}