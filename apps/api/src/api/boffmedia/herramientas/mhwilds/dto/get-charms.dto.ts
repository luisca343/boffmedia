import { PartialType } from '@nestjs/swagger';
import { GetResourceDto } from './get-resource.dto';

export class GetCharmsDto extends PartialType(GetResourceDto) {}
