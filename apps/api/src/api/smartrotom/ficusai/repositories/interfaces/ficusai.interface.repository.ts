import { FicusMessage } from '../../entities/ficus-message.entity';
import { CreateFicusAiMessageDto } from '../../dto/create-message.dto';
import { BaseRepository } from '@api/_utils/repositories/base-repository.interface';

export interface IFicusAiRepository extends BaseRepository<
  FicusMessage,
  CreateFicusAiMessageDto,
  never
> {
  findByUuid(uuid: string, limit?: number): Promise<FicusMessage[]>;
  findRecentByUuid(uuid: string, limit: number): Promise<FicusMessage[]>;
  deleteByUuid(uuid: string): Promise<boolean>;
  countByUuid(uuid: string): Promise<number>;
}
