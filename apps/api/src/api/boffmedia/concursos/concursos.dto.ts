import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsString,
  Length,
  Matches,
  IsIn,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsArray,
  IsObject,
  IsBoolean,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';

export class ConcursosRecoverySettingsDto {
  @ApiProperty({ enum: [1], default: 1 }) @IsIn([1]) version = 1;
  @ApiProperty({ minimum: 0, maximum: 60, default: 5 })
  @IsInt()
  @Min(0)
  @Max(60)
  hostGraceSeconds = 5;
  @ApiProperty({ minimum: 1, maximum: 240, default: 10 })
  @IsInt()
  @Min(1)
  @Max(240)
  hostRetentionMinutes = 10;
  @ApiProperty({ default: false }) @IsBoolean() allowLocalSelectionWhilePaused =
    false;
  @ApiProperty({ default: true }) @IsBoolean() hideQuestionWhilePaused = true;
  @ApiProperty({ minimum: 0, maximum: 10, default: 3 })
  @IsInt()
  @Min(0)
  @Max(10)
  resumeCountdownSeconds = 3;
}
export class CreateConcursosRoomDto {
  @ApiPropertyOptional({ type: ConcursosRecoverySettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConcursosRecoverySettingsDto)
  recoverySettings?: ConcursosRecoverySettingsDto;
}
export class EmptyConcursosCommandDto {}

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
  @ApiPropertyOptional() entityId?: string;
}

export class ConcursosConfigurationDto {
  @ApiPropertyOptional({ type: ConcursosRecoverySettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConcursosRecoverySettingsDto)
  recoverySettings?: ConcursosRecoverySettingsDto;
  @ApiPropertyOptional({ enum: ['individual', 'teams'] })
  @IsOptional()
  @IsIn(['individual', 'teams'])
  mode?: 'individual' | 'teams';
  @ApiPropertyOptional({ enum: ['automatic', 'directed'] })
  @IsOptional()
  @IsIn(['automatic', 'directed'])
  pacing?: 'automatic' | 'directed';
  @ApiPropertyOptional({ default: 8, minimum: 3, maximum: 30 })
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(30)
  resultSeconds?: number;
}
export class ConcursosGroupDto {
  @ApiProperty() @IsString() @IsIn(['team-1', 'team-2']) entityId!: string;
}
export class ConcursosQuestionDto {
  @ApiProperty() @IsString() @Length(1, 160) id!: string;
  @ApiProperty() @IsString() @Length(1, 100) category!: string;
  @ApiProperty() @IsString() @Length(1, 2000) prompt!: string;
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @Length(1, 500, { each: true })
  choices!: string[];
  @ApiProperty() @IsInt() @Min(0) @Max(3) correctIndex!: number;
  @ApiProperty() @IsInt() @Min(1) @Max(3600) seconds!: number;
  @ApiProperty() @IsInt() @Min(0) @Max(100000) points!: number;
  @ApiProperty() @IsInt() @Min(0) @Max(99) phaseIndex!: number;
  @ApiProperty() @IsString() @Length(1, 200) phaseTitle!: string;
}
export class StartConcursosGameDto {
  @ApiProperty({ type: [ConcursosQuestionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ConcursosQuestionDto)
  questions!: ConcursosQuestionDto[];
}
export class ConcursosActionDto {
  @ApiProperty({
    enum: ['choose', 'propose', 'answer', 'next', 'pause', 'resume'],
  })
  @IsIn(['choose', 'propose', 'answer', 'next', 'pause', 'resume'])
  action!: 'choose' | 'propose' | 'answer' | 'next' | 'pause' | 'resume';
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  controlRevision?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 160)
  questionId?: string;
  @ApiPropertyOptional({
    minimum: 0,
    description:
      'Current round; zero is the initial board before the first question.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  roundId?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(3) choice?: number;
}
export class ConcursosEntityDto {
  @ApiProperty() id!: string;
  @ApiProperty() label!: string;
  @ApiProperty({ type: [String] }) memberIds!: string[];
  @ApiPropertyOptional() captainId?: string;
  @ApiProperty() score!: number;
}
export class ConcursosBoardItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() category!: string;
}
export class ConcursosVisibleQuestionDto {
  @ApiProperty() id!: string;
  @ApiProperty() category!: string;
  @ApiProperty() prompt!: string;
  @ApiProperty({ type: [String] }) choices!: string[];
  @ApiPropertyOptional() correctIndex?: number;
}
export class ConcursosProposalDto {
  @ApiProperty() memberId!: string;
  @ApiProperty() choice!: number;
}
export class ConcursosOwnAnswerDto {
  @ApiPropertyOptional() answer?: number;
  @ApiProperty({ type: [ConcursosProposalDto] })
  proposals!: ConcursosProposalDto[];
}
export class ConcursosResultDto {
  @ApiProperty() points!: number;
  @ApiProperty() entityId!: string;
  @ApiPropertyOptional() answer?: number;
  @ApiProperty() correct!: boolean;
}
export class ConcursosGameDto {
  @ApiProperty() paused!: boolean;
  @ApiProperty() controlRevision!: number;
  @ApiPropertyOptional({ enum: ['manual', 'host_disconnected'] }) pauseReason?:
    | 'manual'
    | 'host_disconnected';
  @ApiPropertyOptional() remainingMs?: number;
  @ApiPropertyOptional() resumeAt?: number;
  @ApiProperty({ enum: ['automatic', 'directed'] }) pacing!:
    | 'automatic'
    | 'directed';
  @ApiProperty() resultSeconds!: number;
  @ApiPropertyOptional() advanceAt?: number;
  @ApiProperty({ enum: ['board', 'question', 'result', 'finished'] }) stage!:
    | 'board'
    | 'question'
    | 'result'
    | 'finished';
  @ApiProperty() roundId!: number;
  @ApiProperty() selectorId!: string;
  @ApiProperty() phaseTitle!: string;
  @ApiProperty({ type: [ConcursosBoardItemDto] })
  board!: ConcursosBoardItemDto[];
  @ApiPropertyOptional({ type: ConcursosVisibleQuestionDto })
  question?: ConcursosVisibleQuestionDto;
  @ApiPropertyOptional() deadlineAt?: number;
  @ApiProperty() serverNow!: number;
  @ApiPropertyOptional({ type: ConcursosOwnAnswerDto })
  own?: ConcursosOwnAnswerDto;
  @ApiPropertyOptional({ type: [ConcursosResultDto] })
  results?: ConcursosResultDto[];
}
export class ConcursosRoomDto {
  @ApiProperty() hostConnected!: boolean;
  @ApiProperty({ type: ConcursosRecoverySettingsDto })
  recoverySettings!: ConcursosRecoverySettingsDto;
  @ApiProperty({ enum: ['automatic', 'directed'] }) pacing!:
    | 'automatic'
    | 'directed';
  @ApiProperty() resultSeconds!: number;
  @ApiProperty({ enum: ['individual', 'teams'] }) mode!: 'individual' | 'teams';
  @ApiProperty({ type: [ConcursosEntityDto] }) entities!: ConcursosEntityDto[];
  @ApiPropertyOptional({ type: ConcursosGameDto }) game?: ConcursosGameDto;
  @ApiProperty({ example: 'ABCDXY' }) code!: string;
  @ApiProperty({ enum: ['lobby', 'playing', 'closed'] }) status!:
    | 'lobby'
    | 'playing'
    | 'closed';
  @ApiProperty({ type: [ConcursosMemberDto] }) members!: ConcursosMemberDto[];
  @ApiProperty({ example: 4 }) capacity!: number;
  @ApiProperty({ enum: ['host', 'player'] }) role!: 'host' | 'player';
  @ApiPropertyOptional() memberId?: string;
}

/** JSON text frames on /concursos/socket. Credentials are sent in the first
 * frame, never the URL; all commands retain the existing validated DTOs. */
export class ConcursosSocketRequestDto {
  @ApiProperty({ enum: ['auth', 'ping', 'command'] })
  @IsIn(['auth', 'ping', 'command'])
  type!: 'auth' | 'ping' | 'command';
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 64) id?: string;
  @ApiPropertyOptional() @IsOptional() @Matches(/^[A-Z]{6}$/) code?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^[a-f0-9]{48}$/)
  token?: string;
  @ApiPropertyOptional({
    enum: ['configuration', 'group', 'start', 'action', 'leave', 'close'],
  })
  @IsOptional()
  @IsIn(['configuration', 'group', 'start', 'action', 'leave', 'close'])
  operation?:
    | 'configuration'
    | 'group'
    | 'start'
    | 'action'
    | 'leave'
    | 'close';
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  body?: Record<string, unknown>;
}
export class ConcursosSocketResponseDto {
  @ApiProperty({ enum: ['ready', 'snapshot', 'reply', 'error', 'pong'] })
  type!: 'ready' | 'snapshot' | 'reply' | 'error' | 'pong';
  @ApiPropertyOptional() id?: string;
  @ApiPropertyOptional({ type: ConcursosRoomDto }) data?: ConcursosRoomDto;
  @ApiPropertyOptional() statusCode?: number;
  @ApiPropertyOptional() code?: string;
  @ApiPropertyOptional() userMessage?: string;
}
