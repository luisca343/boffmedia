import { PartialType } from '@nestjs/mapped-types';
import { CreateArcadeStreakDto } from './create-arcade-streak.dto';

export class UpdateArcadeStreakDto extends PartialType(CreateArcadeStreakDto) {}
