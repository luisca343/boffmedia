import { ApiProperty } from '@nestjs/swagger';

export class CreateAppDto {
  @ApiProperty({ description: 'The name of the app' })
  name: string;

  @ApiProperty({ description: 'The URL of the app', required: false })
  url?: string;

  @ApiProperty({ description: 'The active status of the app', required: false })
  active?: number;
}
