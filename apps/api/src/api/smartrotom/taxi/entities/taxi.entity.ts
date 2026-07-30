import { ApiProperty } from '@nestjs/swagger';

export class TripResult {
  @ApiProperty({
    example: 'carretera',
    description: 'Where the player was taken',
  })
  stopId: string;

  @ApiProperty({
    example: 254,
    description: 'What was charged, decided by the server',
  })
  price: number;

  @ApiProperty({ example: 308.4, description: 'Blocks travelled, as priced' })
  distance: number;

  @ApiProperty({
    example: 1842,
    description: 'Ledger transaction id of the fare',
  })
  transactionId: number;

  @ApiProperty({
    example: false,
    description:
      'True when the mod never confirmed the teleport and the trip was settled by reading the ' +
      "player's position back. Included so support can tell those apart in a report.",
  })
  confirmedByPosition: boolean;
}

export class TaxiConfig {
  @ApiProperty({ example: 100 })
  minimumFare: number;

  @ApiProperty({ example: 0.5 })
  pricePerBlock: number;

  @ApiProperty({
    example: 7,
    description:
      'The StarBank account fares are paid into. The travel history is reconstructed from ' +
      'transfers into it, so the web must read this rather than hardcode an id.',
  })
  serviceAccountId: number;

  @ApiProperty({ example: 'Taxi a ' })
  tripConceptPrefix: string;
}
