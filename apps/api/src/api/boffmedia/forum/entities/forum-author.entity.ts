import { ApiProperty } from '@nestjs/swagger';

export type CmTone = 'orange' | 'accent' | 'emerald' | 'purple';

export class ForumAuthor {
  @ApiProperty({ example: 12, description: 'BoffMedia user id' })
  id: number;

  @ApiProperty({ example: 'Nautilus', description: 'Display name (username)' })
  name: string;

  @ApiProperty({ example: 'Nautilus', description: 'Handle (username)' })
  handle: string;

  @ApiProperty({
    example: 'N',
    description: 'Uppercased first-letter avatar initial (fallback "?")',
  })
  avatar: string;

  @ApiProperty({
    type: String,
    example: '/uploads/u/12.jpg',
    description:
      "The author's profile picture URL, or null to fall back to the initial",
    required: false,
    nullable: true,
  })
  avatarUrl: string | null;

  @ApiProperty({
    example: 'orange',
    enum: ['orange', 'accent', 'emerald', 'purple'],
    description: 'Deterministic display tone (id-derived)',
  })
  tone: CmTone;

  @ApiProperty({ example: 'Miembro', description: 'Role label' })
  role: string;
}
