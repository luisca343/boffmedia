import { Injectable } from '@nestjs/common';
import { BaseDataService } from './base-data.service';
import { Attack } from '../../interfaces/pokemon.interface';
import * as path from 'path';
import { FullMove } from '../../entities/pokemon-move.entity';

@Injectable()
export class MoveDataService extends BaseDataService {
  private moveList: FullMove[] = [];
  private movesByName: { [key: string]: FullMove } = {};
  private movesByType: { [key: string]: FullMove[] } = {};
  private movesByCategory: { [key: string]: FullMove[] } = {};

  async loadMoveData() {
    const startingTime = Date.now();
    const defaultDir = path.join(process.cwd(), 'public/smartrotom/packs/default_datapack/data/pixelmon/moves');
    const publicDir = path.join(process.cwd(), 'public/smartrotom/packs/datapack/data/pixelmon/moves');

    const moves = await this.readJsonFiles(defaultDir, publicDir);

    moves.forEach((move: FullMove) => {
      this.moveList.push(move);
      this.movesByName[move.attackName] = move;
      if (!this.movesByType[move.attackType]) this.movesByType[move.attackType] = [];
      this.movesByType[move.attackType].push(move);
      if (!this.movesByCategory[move.attackCategory]) this.movesByCategory[move.attackCategory] = [];
      this.movesByCategory[move.attackCategory].push(move);
    });

    console.log(`Loaded ${moves.length} moves in ${Date.now() - startingTime}ms`);
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

