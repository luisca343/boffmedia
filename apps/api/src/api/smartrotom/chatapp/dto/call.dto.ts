import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsNumber, IsEnum } from 'class-validator';

export enum CallStatus {
  RINGING = 'RINGING',
  IN_CALL = 'IN_CALL',
  DECLINED = 'DECLINED',
  BUSY = 'BUSY',
}

export class InitiateCallDto extends BaseDto {
  @ApiProperty({
    description: 'Chat ID',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  chatId: number;

  @ApiProperty({
    description: 'Caller UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;
}

export class EndCallDto extends BaseDto {
  @ApiProperty({
    description: 'Chat ID',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  chatId: number;

  @ApiProperty({
    description: 'Call start time (timestamp)',
    example: 1640995200000,
  })
  @IsNotEmpty()
  @IsNumber()
  startTime: number;
}

export class CallUserResponseDto extends BaseDto {
  @ApiProperty({
    description: 'User UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  uuid: string;

  @ApiProperty({
    description: 'User call status',
    enum: CallStatus,
    example: CallStatus.RINGING,
  })
  status: CallStatus;
}

export class CallSessionResponseDto extends BaseDto {
  @ApiProperty({
    description: 'Unique call identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  callId: string;

  @ApiProperty({
    description: 'Chat ID',
    example: 1,
  })
  chatId: number;

  @ApiProperty({
    description: 'Caller UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  caller: string;

  @ApiProperty({
    description: 'Users in the call',
    type: [CallUserResponseDto],
  })
  users: CallUserResponseDto[];
}
