import { Injectable } from '@nestjs/common';
import { BaseDataService } from './base-data.service';
import { FullMove } from '../../entities/pokemon-move.entity';
import { Logger } from 'nestjs-pino';
import { publicPath } from '@/config/paths';

@Injectable()
export class MoveDataService extends BaseDataService {
  constructor(private readonly logger: Logger) {
    super();
  }

  private moveList: FullMove[] = [];
  private movesByName: { [key: string]: FullMove } = {};
  private movesByType: { [key: string]: FullMove[] } = {};
  private movesByCategory: { [key: string]: FullMove[] } = {};

  async loadMoveData() {
    const startingTime = Date.now();
    const defaultDir = publicPath(
      'smartrotom/packs/default_datapack_9.4.0/data/pixelmon/moves',
    );
    const publicDir = publicPath(
      'smartrotom/packs/datapack/data/pixelmon/moves',
    );

    const moves = await this.readJsonFiles(defaultDir, publicDir);

    moves.forEach((move: FullMove) => {
      this.moveList.push(move);
      this.movesByName[move.attackName] = move;
      if (!this.movesByType[move.attackType])
        this.movesByType[move.attackType] = [];
      this.movesByType[move.attackType].push(move);
      if (!this.movesByCategory[move.attackCategory])
        this.movesByCategory[move.attackCategory] = [];
      this.movesByCategory[move.attackCategory].push(move);
    });

    this.logger.log(
      `Loaded ${moves.length} moves in ${Date.now() - startingTime}ms`,
    );
  }

  getMovesByName() {
    return this.movesByName;
  }

  getMovesByType() {
    return this.movesByType;
  }

  getMovesByCategory() {
    return this.movesByCategory;
  }

  getAllMoves() {
    return this.moveList;
  }

  getMove(name: string): FullMove | undefined {
    return this.movesByName[name];
  }

  getMovesOfType(type: string): FullMove[] {
    return this.movesByType[type] || [];
  }

  getMovesOfCategory(category: string): FullMove[] {
    return this.movesByCategory[category] || [];
  }
}
