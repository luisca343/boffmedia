import { PartialType } from '@nestjs/mapped-types';
import { GetResourceDto } from './get-resource.dto';

export class GetArmorDto extends PartialType(GetResourceDto) {}
