import { SmartRotomApp } from '@/_db/schema/SmartRotom';
import { CreateAppDto } from '../../dto/create-app.dto';
import { UpdateAppDto } from '../../dto/update-app.dto';
import { BaseRepository } from '@api/_utils/repositories/base-repository.interface';

export interface IAppsRepository extends BaseRepository<
  SmartRotomApp,
  CreateAppDto,
  UpdateAppDto
> {
  findByUrl(url: string): Promise<SmartRotomApp | null>;
  findActiveApps(): Promise<SmartRotomApp[]>;
  findByActive(active: number): Promise<SmartRotomApp[]>;
}
