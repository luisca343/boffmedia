import { PartialType } from '@nestjs/mapped-types';
import { GetResourceDto } from './get-resource.dto';

export class GetSkillsDto extends PartialType(GetResourceDto) {}
