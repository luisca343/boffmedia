import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { BaseDto } from '@api/_utils/dto/base.dto';
import { PagedQueryDto } from '../../_shared/dto/paged-query.dto';

const GOBIERNO_ROLE_NAMES = [
  USER_ROLES.GOBIERNO,
  USER_ROLES.GOB_AGENTE,
  USER_ROLES.GOB_INSPECTOR,
  USER_ROLES.GOB_ALCALDE,
] as const;

export class ListCensoQueryDto extends PagedQueryDto {
  @ApiPropertyOptional({
    example: 'trainer',
    description: 'Search by username',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ['bueno', 'observado', 'sancionado'],
    description:
      'Filter by civic standing. Standing is DERIVED from the real multas/buscados registers, not a column, so this filter is applied after derivation rather than in SQL.',
  })
  @IsOptional()
  @IsEnum(['bueno', 'observado', 'sancionado'])
  standing?: 'bueno' | 'observado' | 'sancionado';
}

export class GrantRoleDto extends BaseDto {
  @ApiProperty({ enum: GOBIERNO_ROLE_NAMES })
  @IsEnum(GOBIERNO_ROLE_NAMES)
  role: (typeof GOBIERNO_ROLE_NAMES)[number];

  @ApiPropertyOptional({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsOptional()
  @IsUUID()
  actorUuid?: string;
}

export class RevokeRoleDto extends BaseDto {
  @ApiPropertyOptional({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsOptional()
  @IsUUID()
  actorUuid?: string;
}

export { GOBIERNO_ROLE_NAMES };
