import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

export class SmartrotomRequestDto {
  @ApiHideProperty()
  uuid: string;

  @ApiHideProperty()
  server: string;
}

export class UuidDto extends SmartrotomRequestDto {
  @ApiProperty({ description: 'UUID' })
  uuid: string;
}