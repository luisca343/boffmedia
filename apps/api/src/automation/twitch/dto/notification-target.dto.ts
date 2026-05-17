import { IsString, IsIn, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class NotificationConfigDto {
  @IsString() @IsOptional() channelId?: string;
  @IsString() @IsOptional() botToken?: string;
  @IsString() @IsOptional() url?: string;
  @IsOptional() headers?: Record<string, string>;
  @IsString() @IsOptional() table?: string;
  @IsString() @IsOptional() message?: string;
  @IsString() @IsOptional() template?: string;
}

export class NotificationTargetDto {
  @IsString()
  @IsIn(['discord', 'webhook', 'database'])
  type: 'discord' | 'webhook' | 'database';

  @ValidateNested()
  @Type(() => NotificationConfigDto)
  config: NotificationConfigDto;
}
