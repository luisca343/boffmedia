import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiVersionEntity {
  @ApiProperty({ example: 'api' })
  surface!: 'api';

  @ApiProperty({ example: '0.9.1-beta.1' })
  version!: string;

  @ApiProperty({ example: '5d411d424' })
  gitSha!: string;

  @ApiProperty({ example: 'api-1234' })
  buildId!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'a1b2c3d4' })
  versionFileSha!: string | null;
}
