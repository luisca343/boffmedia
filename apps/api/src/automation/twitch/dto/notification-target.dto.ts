import { IsString, IsIn, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class NotificationConfigDto {
  @ApiPropertyOptional() @IsString() @IsOptional() channelId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() botToken?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() url?: string;
  @ApiPropertyOptional({ type: Object }) @IsOptional() headers?: Record<
    string,
    string
  >;
  @ApiPropertyOptional() @IsString() @IsOptional() table?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() message?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() template?: string;
}

export class NotificationTargetDto {
  @ApiProperty({ enum: ['discord', 'webhook', 'database'] })
  @IsString()
  @IsIn(['discord', 'webhook', 'database'])
  type: 'discord' | 'webhook' | 'database';

  @ApiProperty({ type: NotificationConfigDto })
  @ValidateNested()
  @Type(() => NotificationConfigDto)
  config: NotificationConfigDto;
}
