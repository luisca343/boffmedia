import { ApiProperty } from '@nestjs/swagger';

export class WingullBalanceDto {
  @ApiProperty({ example: 1000 })
  balance: number;

  @ApiProperty({ example: 'money', description: 'Type of balance' })
  type: string;

  @ApiProperty({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'Player UUID',
  })
  uuid: string;
}
