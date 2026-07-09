import { ApiProperty } from '@nestjs/swagger';

export class PublicProfileEntity {
  @ApiProperty({ example: 42 })
  id: number;

  @ApiProperty({ example: 'AshKetchum' })
  name: string;

  @ApiProperty({ nullable: true, example: 'https://cdn.boffmedia.es/u/42.png' })
  avatarUrl: string | null;

  @ApiProperty({ nullable: true })
  coverUrl: string | null;

  @ApiProperty({ nullable: true, example: 'VGC player and Minecraft builder.' })
  bio: string | null;

  @ApiProperty({ type: [String], example: ['BOFF_ADMIN'] })
  roles: string[];

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  memberSince: string | null;
}
