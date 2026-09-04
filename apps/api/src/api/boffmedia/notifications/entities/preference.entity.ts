import { ApiProperty } from '@nestjs/swagger';

export class PreferenceEntity {
  @ApiProperty({
    description: 'Notification type',
  })
  type: string;

  @ApiProperty({
    description: 'Whether this notification type is muted',
  })
  isMuted: boolean;
}

export class PreferencesListEntity {
  @ApiProperty({
    type: [PreferenceEntity],
    description: 'All notification type preferences for the user',
  })
  preferences: PreferenceEntity[];
}
