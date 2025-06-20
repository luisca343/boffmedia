import { BaseRepository } from '@api/_utils/repositories/base-repository.interface';

export interface IReplaysRepository extends BaseRepository<any, any, any> {
  createUserReplay(userReplayData: any): Promise<{ insertId: number }>;
  findUserReplay(uuid: string, replayId: number): Promise<any | null>;
}