import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class McDeviceCodeEntity {
  @ApiProperty({ example: 'A1B2-C3D4' })
  userCode!: string;

  @ApiProperty({ example: 'https://www.microsoft.com/link' })
  verificationUri!: string;

  @ApiProperty({ example: 900 })
  expiresIn!: number;

  @ApiProperty({ example: 5 })
  intervalSeconds!: number;
}

export class McLinkPollEntity {
  @ApiProperty({ enum: ['pending', 'linked', 'declined', 'expired'] })
  status!: 'pending' | 'linked' | 'declined' | 'expired';

  @ApiPropertyOptional({ example: '069a79f4-44e9-4726-a5be-fca90e38aaf5' })
  uuid?: string;

  @ApiPropertyOptional({ example: 'TrainerAsh' })
  username?: string;
}

export class McJoinChallengeEntity {
  @ApiProperty({ description: 'Preséntalo a Mojang en session/minecraft/join' })
  serverId!: string;

  @ApiProperty({ example: 60 })
  expiresInSeconds!: number;
}
