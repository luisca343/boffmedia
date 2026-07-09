import { PartialType } from '@nestjs/swagger';
import { CreateArcadeStreakDto } from './create-arcade-streak.dto';

export class UpdateArcadeStreakDto extends PartialType(CreateArcadeStreakDto) {}
