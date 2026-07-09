import { PartialType } from '@nestjs/swagger';
import { CreateReplayFullDto } from './create-replay-full.dto';

export class UpdateReplayDto extends PartialType(CreateReplayFullDto) {}
