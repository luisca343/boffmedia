import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SharexTokenEntity {
  @ApiProperty({ example: 3 })
  id: number;

  @ApiProperty({ example: 'Luisca desktop' })
  label: string;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'Boffmedia account that issued it, if any.',
    example: 1,
  })
  createdBy: number | null;

  @ApiProperty({ example: '2026-08-20T10:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({
    type: Date,
    nullable: true,
    description: 'Last upload accepted with this token.',
  })
  usedAt: Date | null;

  @ApiProperty({
    example: false,
    description: 'Revoked tokens are kept so their uploads stay attributable.',
  })
  revoked: boolean;
}

export class CreatedSharexTokenEntity {
  @ApiProperty({
    description:
      'The plaintext token. Returned ONCE, on creation — only its hash is ' +
      'stored, so a lost token is reissued rather than recovered.',
    example: 'a3f1…',
  })
  token: string;

  @ApiProperty({ type: SharexTokenEntity })
  summary: SharexTokenEntity;
}
