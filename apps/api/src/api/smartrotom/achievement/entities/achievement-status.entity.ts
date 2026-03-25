import { ApiProperty } from '@nestjs/swagger';

export class AchievementStatusEntity {
  @ApiProperty({ 
    example: 'medalla_denki', 
    description: 'Achievement ID' 
  })
  id: string;

  @ApiProperty({ 
    example: 1, 
    description: 'Completion status (0 = not completed, 1 = completed)',
    nullable: true
  })
  completed: number | null;
}