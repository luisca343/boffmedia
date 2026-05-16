import { BaseInsertResponse } from '@api/_utils/dto/base-responses.dto';
import { BaseRepository } from '@api/_utils/repositories/base-repository.interface';
import { Replay } from '../../entities/replay.entity';
import { UserReplayEntity } from '../../entities/user-replay.entity';
import { CreateReplayFullDto } from '../../dto/create-replay-full.dto';
import { UpdateReplayDto } from '../../dto/update-replay.dto';

export interface IReplaysRepository extends BaseRepository<
  Replay,
  CreateReplayFullDto,
  UpdateReplayDto
> {
  createUserReplay(
    userReplayData: UserReplayEntity,
  ): Promise<BaseInsertResponse>;
  findUserReplay(uuid: string, replayId: number): Promise<Replay | null>;
}
