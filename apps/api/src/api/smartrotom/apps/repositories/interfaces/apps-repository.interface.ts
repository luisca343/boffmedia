import { RotomApp } from '@/_db/schema/SmartRotom';
import { CreateAppDto } from '../../dto/create-app.dto';
import { UpdateAppDto } from '../../dto/update-app.dto';
import { BaseRepository } from '@api/_utils/repositories/base-repository.interface';

export interface IAppsRepository extends BaseRepository<
  RotomApp,
  CreateAppDto,
  UpdateAppDto
> {
  findByUrl(url: string): Promise<RotomApp | null>;
  findActiveApps(): Promise<RotomApp[]>;
  findByActive(active: boolean): Promise<RotomApp[]>;
}
