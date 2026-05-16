import { PartialType } from '@nestjs/mapped-types';
import { CreateReplayFullDto } from './create-replay-full.dto';

export class UpdateReplayDto extends PartialType(CreateReplayFullDto) {}
