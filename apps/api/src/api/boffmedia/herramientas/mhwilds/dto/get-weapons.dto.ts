import { PartialType } from '@nestjs/swagger';
import { GetResourceDto } from './get-resource.dto';

export class GetWeaponsDto extends PartialType(GetResourceDto) {}
