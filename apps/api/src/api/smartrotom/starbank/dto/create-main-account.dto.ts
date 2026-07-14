import { IsUUID, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@api/_utils/dto/base.dto';

export class CreateMainAccountDto extends BaseDto {
  @ApiProperty()
  @IsUUID()
  uuid: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string;
}
