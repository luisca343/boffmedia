import { SmartRotomUser } from '@/_db/schema/SmartRotom';
import { CreateSmartrotomUserDto } from '../../dto/create-user.dto';
import { UpdateSmartrotomUserDto } from '../../dto/update-user.dto';
import { BaseRepository } from '@api/_utils/repositories/base-repository.interface';

export interface IUsersRepository extends BaseRepository<SmartRotomUser, CreateSmartrotomUserDto, UpdateSmartrotomUserDto> {
  findByUuid(uuid: string): Promise<SmartRotomUser | null>;
  findByUsername(username: string): Promise<SmartRotomUser | null>;
  findByUuids(uuids: string[]): Promise<{ [uuid: string]: SmartRotomUser | null }>;
  getUserCount(): Promise<number>;
}