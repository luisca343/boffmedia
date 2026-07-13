import { PcMark } from '../../entities/pc-mark.entity';

export interface PcMarkWrite {
  favorite: boolean;
  tags: string[];
}

export interface IPcMarksRepository {
  findByUser(uuid: string): Promise<PcMark[]>;
  findByKeys(uuid: string, pokemonKeys: string[]): Promise<PcMark[]>;
  findOne(uuid: string, pokemonKey: string): Promise<PcMark | null>;
  upsert(uuid: string, pokemonKey: string, data: PcMarkWrite): Promise<PcMark>;
  upsertMany(
    uuid: string,
    rows: { pokemonKey: string; favorite: boolean; tags: string[] }[],
  ): Promise<PcMark[]>;
}
