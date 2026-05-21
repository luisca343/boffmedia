import { ApiProperty } from '@nestjs/swagger';
import { AppStatus } from '../enums/app-status.enum';

export class SmartRotomApp {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the app',
  })
  id: number;

  @ApiProperty({
    example: 'Mina',
    description: 'Name of the app',
  })
  name: string;

  @ApiProperty({
    example: 'mina',
    description: 'URL or path to the app',
    nullable: true,
  })
  url: string | null;

  @ApiProperty({
    example: AppStatus.ACTIVE,
    description: 'Whether the app is active',
    enum: AppStatus,
    nullable: true,
  })
  active: number | null;
}
