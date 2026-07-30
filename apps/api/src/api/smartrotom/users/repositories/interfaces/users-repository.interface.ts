import { RotomUser } from '@/_db/schema/SmartRotom';
import { CreateSmartrotomUserDto } from '../../dto/create-user.dto';
import { UpdateSmartrotomUserDto } from '../../dto/update-user.dto';
import { BaseRepository } from '@api/_utils/repositories/base-repository.interface';

export interface IUsersRepository extends BaseRepository<
  RotomUser,
  CreateSmartrotomUserDto,
  UpdateSmartrotomUserDto
> {
  findByUuid(uuid: string): Promise<RotomUser | null>;
  findByUsername(username: string): Promise<RotomUser | null>;
  findByUuids(uuids: string[]): Promise<{ [uuid: string]: RotomUser | null }>;
  getUserCount(): Promise<number>;
}
