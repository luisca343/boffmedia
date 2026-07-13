import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { BaseDto } from '@api/_utils/dto/base.dto';

// Minimal body for mutating endpoints on tables that carry no actor column of their own
// (zonas, tasas, npc-skins…) — exists purely so AuditoriaService.log() has an actorUuid, and
// so DELETE requests under /smartrotom/ satisfy MinecraftMiddleware's body.server check.
export class ActorBodyDto extends BaseDto {
  @ApiPropertyOptional({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsOptional()
  @IsUUID()
  actorUuid?: string;
}
