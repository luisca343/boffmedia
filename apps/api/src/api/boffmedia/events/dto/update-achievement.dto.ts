import { PartialType } from '@nestjs/swagger';
import { CreateEventAchievementDto } from './create-achievement.dto';

export class UpdateEventAchievementDto extends PartialType(
  CreateEventAchievementDto,
) {}
