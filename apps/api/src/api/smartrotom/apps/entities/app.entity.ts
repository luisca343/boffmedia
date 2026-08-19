import { ApiProperty } from '@nestjs/swagger';

export class RotomApp {
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
    type: String,
    nullable: true,
  })
  url: string | null;

  @ApiProperty({
    example: true,
    description: 'Whether the app is active',
  })
  active: boolean;
}
