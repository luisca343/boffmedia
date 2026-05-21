import { PartialType } from '@nestjs/mapped-types';
import { GetResourceDto } from './get-resource.dto';

export class GetDecorationsDto extends PartialType(GetResourceDto) {}
