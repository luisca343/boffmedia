import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

export class CreateConcursosRoomDto {}

export class JoinConcursosRoomDto {
  @ApiProperty({ maxLength: 24, minLength: 1, example: 'Lucía' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().normalize('NFC') : value,
  )
  @IsString()
  @Length(1, 24)
  @Matches(/^[^\u0000-\u001f\u007f]+$/u)
  nickname!: string;
}

export class ConcursosMemberDto {
  @ApiProperty() id!: string;
  @ApiProperty() nickname!: string;
  @ApiProperty() connected!: boolean;
}

export class ConcursosRoomDto {
  @ApiProperty({ example: 'ABCDXY' }) code!: string;
  @ApiProperty({ enum: ['lobby', 'closed'] }) status!: 'lobby' | 'closed';
  @ApiProperty({ type: [ConcursosMemberDto] }) members!: ConcursosMemberDto[];
  @ApiProperty({ example: 4 }) capacity!: number;
  @ApiProperty({ enum: ['host', 'player'] }) role!: 'host' | 'player';
  @ApiPropertyOptional() memberId?: string;
}
