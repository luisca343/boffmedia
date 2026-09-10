import { ApiProperty } from '@nestjs/swagger';

export class AnatomyPointEntity {
  @ApiProperty({ minimum: 0, maximum: 100, example: 42.5 })
  x!: number;

  @ApiProperty({ minimum: 0, maximum: 100, example: 37.25 })
  y!: number;
}

export class AnatomyCalloutEntity {
  @ApiProperty({ example: 'leftTop' })
  slotKey!: string;

  @ApiProperty({ type: AnatomyPointEntity })
  target!: AnatomyPointEntity;
}

export class AnatomyOverrideEntity {
  @ApiProperty({ example: -758250816 })
  fixedId!: number;

  @ApiProperty({ example: '00' })
  variantId!: string;

  @ApiProperty({ type: [AnatomyCalloutEntity] })
  callouts!: AnatomyCalloutEntity[];

  @ApiProperty({ example: '2026-09-10T12:00:00.000Z' })
  updatedAt!: string;
}

export class DeleteAnatomyOverrideEntity {
  @ApiProperty({ example: true })
  deleted!: boolean;
}
