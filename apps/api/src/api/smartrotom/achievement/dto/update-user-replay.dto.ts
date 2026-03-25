import { PartialType } from '@nestjs/mapped-types';
import { CreateUserReplayDto } from './create-user-replay.dto';

export class UpdateUserReplayDto extends PartialType(CreateUserReplayDto) {}