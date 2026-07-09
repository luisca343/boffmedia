import { PartialType } from '@nestjs/swagger';
import { GetResourceDto } from './get-resource.dto';

export class GetCharmRanksDto extends PartialType(GetResourceDto) {}
