import { PartialType } from '@nestjs/swagger';
import { CreateEventAchievementDto } from './create-achievement.dto';

export class UpdateAchievementDto extends PartialType(CreateEventAchievementDto) {}
