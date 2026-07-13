import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

// Pasaporte is read-only: every route is a GET addressed by the trainer's uuid, so
// nothing here extends BaseDto — that is only needed for @Body DTOs, which must carry
// `server` past ValidationPipe's forbidNonWhitelisted and MinecraftMiddleware.

export class TrainerParamsDto {
  @ApiProperty({ description: "The trainer's UUID" })
  @IsUUID()
  uuid: string;
}
