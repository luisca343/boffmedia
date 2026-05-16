import { ApiProperty } from '@nestjs/swagger';

export class UpdateDex {
  @ApiProperty({ type: [Number] })
  SEEN: number[];

  @ApiProperty({ type: [Number] })
  CAUGHT: number[];

  constructor(data: { SEEN: number[]; CAUGHT: number[] }) {
    this.SEEN = data.SEEN;
    this.CAUGHT = data.CAUGHT;
  }
}
