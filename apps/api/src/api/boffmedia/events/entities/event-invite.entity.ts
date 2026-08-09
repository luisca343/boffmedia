import { ApiProperty } from '@nestjs/swagger';

export class EventInviteEntity {
  @ApiProperty({ example: 'A1B2C3D4E5F60718293A' })
  code: string;

  @ApiProperty({ example: 12 })
  eventId: number;

  @ApiProperty({ example: 3, required: false, nullable: true })
  createdBy?: number | null;

  @ApiProperty({ example: '2026-08-09T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ required: false, nullable: true })
  expiresAt?: Date | null;

  @ApiProperty({ example: 1 })
  maxUses: number;

  @ApiProperty({ example: 0 })
  uses: number;

  @ApiProperty({ example: false })
  revoked: boolean;
}

export class RedeemEventInviteResponseEntity {
  @ApiProperty({ example: 12, description: 'The event that was joined.' })
  eventId: number;
}
