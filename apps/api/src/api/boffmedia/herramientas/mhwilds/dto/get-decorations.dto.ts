import { PartialType } from '@nestjs/swagger';
import { GetResourceDto } from './get-resource.dto';

export class GetDecorationsDto extends PartialType(GetResourceDto) {}
