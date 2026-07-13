import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Every player uuid stored on a gobierno row is rendered as one of these instead of a bare
// string — the frontend shows names/avatars everywhere and must not N+1 to resolve them.
export class PersonRefEntity {
  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  uuid: string;

  @ApiPropertyOptional({ example: 'TrainerAsh', nullable: true })
  username?: string | null;
}

export function toPersonRef(
  uuid: string | null | undefined,
  names: Map<string, string>,
): PersonRefEntity | null {
  if (!uuid) return null;
  return { uuid, username: names.get(uuid) ?? null };
}
