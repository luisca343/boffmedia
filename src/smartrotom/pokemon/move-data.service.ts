import { Injectable } from '@nestjs/common';
import { BaseDataService } from './base-data.service';
import { Attack } from './interfaces/pokemon.interface';
import * as path from 'path';

@Injectable()
export class MoveDataService extends BaseDataService {
  private moveList: Attack[] = [];
  private movesByName: { [key: string]: Attack } = {};
  private movesByType: { [key: string]: Attack[] } = {};
  private movesByCategory: { [key: string]: Attack[] } = {};

  async loadMoveData() {
    const startingTime = Date.now();
    const defaultDir = path.join(__dirname, '../../../../public/smartrotom/packs/default_datapack/data/pixelmon/moves');
    const publicDir = path.join(__dirname, '../../../../public/smartrotom/packs/datapack/data/pixelmon/moves');

    const moves = await this.readJsonFiles(defaultDir, publicDir);

    moves.forEach((move: Attack) => {
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

  getMove(name: string): Attack | undefined {
    return this.movesByName[name];
  }

  getMovesOfType(type: string): Attack[] {
    return this.movesByType[type] || [];
  }

  getMovesOfCategory(category: string): Attack[] {
    return this.movesByCategory[category] || [];
  }
}

