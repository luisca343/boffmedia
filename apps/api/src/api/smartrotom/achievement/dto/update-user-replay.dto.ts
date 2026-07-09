import { PartialType } from '@nestjs/swagger';
import { CreateUserReplayDto } from './create-user-replay.dto';

export class UpdateUserReplayDto extends PartialType(CreateUserReplayDto) {}
