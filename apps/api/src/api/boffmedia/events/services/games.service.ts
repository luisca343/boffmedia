import { Injectable } from '@nestjs/common';
import { GamesRepository } from '../../../_repositories/boffmedia/games.repository';
import { Game } from '@/_db/schema/Events';
import { CreateGameDto } from '../dto/create-game.dto';
import { UpdateEventDto } from '../dto/update-event.dto';

@Injectable()
export class GamesService {
  constructor(private readonly gamesRepository: GamesRepository) {}

  async getAllGames(): Promise<Game[]> {
    return this.gamesRepository.findAll();
  }

  async getGameById(id: number): Promise<Game> {
    return this.gamesRepository.findById(id) as Promise<Game>;
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

  async updateGame(id: number, updateEventDto: UpdateEventDto): Promise<Game> {
    const gameData = {
      title: updateEventDto.title,
      description: updateEventDto.description,
      icon: updateEventDto.icon,
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
