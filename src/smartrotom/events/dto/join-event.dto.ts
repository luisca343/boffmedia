import { ApiProperty } from '@nestjs/swagger';

export class JoinEventDto {
  @ApiProperty({ description: 'The user ID trying to join the event' })
  userId: number;

  @ApiProperty({ description: 'Optional nickname for the participant', required: false })
  nickname?: string;

  @ApiProperty({ description: 'Optional avatar URL', required: false })
  avatar?: string;

  @ApiProperty({ 
    description: 'Optional comment or reason for joining', 
    required: false 
  })
  comment?: string;
}