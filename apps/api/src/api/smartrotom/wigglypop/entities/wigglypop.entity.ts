import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Entities are declared locally, never imported from @boffmedia/shared — importing the shared
// package from apps/api breaks `nest start`.

export class WigglypopPersonRef {
  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  uuid: string;

  @ApiPropertyOptional({
    example: 'Luisca',
    description: 'null when the uuid is not a known SmartRotom user',
    nullable: true,
  })
  username: string | null;
}

export class WigglypopListingMonEntity {
  @ApiProperty() id: number;
  @ApiProperty() pokemonKey: string;
  @ApiProperty({ description: 'PC box the mon sat in when listed' }) sourceBox: number;
  @ApiProperty() sourceIndex: number;
  @ApiProperty() dex: number;
  @ApiProperty() species: string;
  @ApiPropertyOptional({ nullable: true }) form: string | null;
  @ApiPropertyOptional({ nullable: true }) palette: string | null;
  @ApiPropertyOptional({ nullable: true }) name: string | null;
  @ApiProperty() level: number;
  @ApiPropertyOptional({ nullable: true }) nature: string | null;
  @ApiPropertyOptional({ nullable: true }) ability: string | null;
  @ApiPropertyOptional({ nullable: true }) gender: string | null;
  @ApiPropertyOptional({ nullable: true }) heldItem: string | null;
  @ApiPropertyOptional({ nullable: true }) ball: string | null;
  @ApiPropertyOptional({ nullable: true }) ot: string | null;
  @ApiPropertyOptional({ nullable: true }) caughtIn: string | null;

  // `type: [Number]` is load-bearing: an array @ApiProperty with only an `example` gives the
  // OpenAPI generator nothing to infer from, and it ships these as string[] — which silently
  // turns every IV sum downstream into string concatenation. Same trap as PokemonW.
  @ApiProperty({ type: [Number], example: [31, 31, 31, 31, 31, 31], nullable: true })
  ivs: number[] | null;

  @ApiProperty({ type: [Number], example: [252, 0, 4, 252, 0, 0], nullable: true })
  evs: number[] | null;

  @ApiProperty({ type: [Number], example: [341, 200, 180, 220, 190, 260], nullable: true })
  stats: number[] | null;

  @ApiProperty({ type: [String], nullable: true })
  moves: (string | null)[] | null;

  @ApiProperty({ example: 'epico' }) rarity: string;
  @ApiProperty() legendary: boolean;
  @ApiProperty() shiny: boolean;
  @ApiProperty({ description: 'Deterministic valuation at listing time' }) value: number;
}

export class WigglypopListingItemEntity {
  @ApiProperty() id: number;
  @ApiProperty({ example: 'pixelmon:master_ball' }) itemId: string;
  @ApiProperty({ example: 'Master Ball' }) itemName: string;
  @ApiPropertyOptional({ nullable: true }) category: string | null;
  @ApiProperty() qty: number;
  @ApiProperty() unitPrice: number;
}

// The item picker's source of truth. There is no bag API on the game server, so a seller
// declares what they are selling by choosing from this list rather than from a real inventory.
export class WigglypopItemCatalogEntity {
  @ApiProperty({ example: 'pixelmon:master_ball' }) id: string;
  @ApiProperty({ example: 'Master Ball' }) name: string;
  @ApiProperty({ example: 'pokeballs' }) category: string;
  @ApiProperty({ example: 25000, description: 'Reference price for one unit' })
  refPrice: number;
  @ApiPropertyOptional({ nullable: true }) sprite: string | null;
}

export class WigglypopListingEntity {
  @ApiProperty() id: number;
  @ApiProperty({ example: 'LST-9F3A21BC' }) code: string;
  @ApiProperty({ type: WigglypopPersonRef }) seller: WigglypopPersonRef;
  @ApiProperty({ example: 'mon' }) kind: string;
  @ApiProperty({ example: 'fixed' }) format: string;
  @ApiProperty() title: string;
  @ApiPropertyOptional({ nullable: true }) note: string | null;
  @ApiProperty({ example: 'activo' }) status: string;
  @ApiProperty() price: number;
  @ApiProperty({ description: 'The tasación. Never used to charge anybody.' }) value: number;
  @ApiProperty() escrow: boolean;
  @ApiProperty() views: number;

  // Both are COUNTs over live rows, not cached columns — so they cannot drift — and both are 0
  // rather than null when there is nothing to count.
  @ApiProperty({
    example: 4,
    description: 'How many players have this listing on their watchlist',
  })
  watchers: number;

  @ApiProperty({
    example: 2,
    description: 'Pending offers on this listing (status = pendiente)',
  })
  offers: number;

  @ApiProperty({ type: WigglypopListingMonEntity, isArray: true })
  mons: WigglypopListingMonEntity[];

  @ApiProperty({ type: WigglypopListingItemEntity, isArray: true })
  items: WigglypopListingItemEntity[];

  @ApiPropertyOptional({ nullable: true }) startsAt: Date | null;
  @ApiPropertyOptional({ nullable: true }) endsAt: Date | null;
  @ApiProperty() currentBid: number;
  @ApiProperty() bids: number;
  @ApiProperty() minIncrement: number;
  @ApiPropertyOptional({ nullable: true }) buyNow: number | null;

  @ApiPropertyOptional({ type: [String], nullable: true }) wants: string[] | null;
  @ApiProperty() tradePlus: boolean;

  @ApiPropertyOptional({ nullable: true }) soldAt: Date | null;
  @ApiPropertyOptional({ nullable: true }) soldFor: number | null;
  @ApiPropertyOptional({ nullable: true }) soldOrderId: number | null;

  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class WigglypopListingListEntity {
  @ApiProperty({ type: WigglypopListingEntity, isArray: true })
  items: WigglypopListingEntity[];

  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
}

export class WigglypopBidEntity {
  @ApiProperty() id: number;
  @ApiProperty() listingId: number;
  @ApiProperty({ type: WigglypopPersonRef }) bidder: WigglypopPersonRef;
  @ApiProperty() amount: number;
  @ApiProperty() createdAt: Date;
}

export class WigglypopValuationEntity {
  @ApiProperty({ example: 12350, description: 'Rounded to the nearest 50' })
  value: number;

  @ApiProperty({ example: 'epico', enum: ['comun', 'raro', 'epico', 'legendario'] })
  rarity: string;
}

export class WigglypopOrderLineEntity {
  @ApiProperty() id: number;
  @ApiProperty() listingId: number;
  @ApiProperty({ type: WigglypopPersonRef }) seller: WigglypopPersonRef;
  @ApiProperty({ example: 'mon' }) kind: string;
  @ApiProperty() qty: number;
  @ApiProperty() unitPrice: number;
  @ApiProperty() lineTotal: number;

  @ApiProperty({
    example: 'pendiente',
    description:
      'pendiente → transferido → confirmado (manual custody), or straight to confirmado (atomic)',
  })
  deliveryStatus: string;

  @ApiPropertyOptional({ nullable: true }) settleTxId: number | null;
  @ApiPropertyOptional({ nullable: true }) confirmedAt: Date | null;

  @ApiPropertyOptional({
    type: WigglypopListingEntity,
    description: 'The listing this line bought, as it stood',
  })
  listing?: WigglypopListingEntity;
}

export class WigglypopOrderEntity {
  @ApiProperty() id: number;
  @ApiProperty({ example: 'ORD-4B7C09EE' }) code: string;
  @ApiProperty({ type: WigglypopPersonRef }) buyer: WigglypopPersonRef;
  @ApiProperty() subtotal: number;
  @ApiProperty({ description: 'House fee, kept by the escrow account' }) fee: number;
  @ApiProperty() total: number;

  @ApiProperty({
    example: 'escrow',
    description: 'escrow → transferido → completado, or cancelado',
  })
  status: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'The real StarBank buyer → escrow transfer. Not a bookkeeping row.',
  })
  escrowTxId: number | null;

  @ApiProperty({ type: WigglypopOrderLineEntity, isArray: true })
  lines: WigglypopOrderLineEntity[];

  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class WigglypopOfferEntity {
  @ApiProperty() id: number;
  @ApiProperty() listingId: number;
  @ApiProperty({ type: WigglypopPersonRef }) buyer: WigglypopPersonRef;
  @ApiProperty() amount: number;
  @ApiProperty() qty: number;
  @ApiProperty({ example: 'pendiente' }) status: string;
  @ApiProperty() createdAt: Date;
  @ApiPropertyOptional({ nullable: true }) respondedAt: Date | null;

  @ApiPropertyOptional({ type: WigglypopListingEntity })
  listing?: WigglypopListingEntity;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Set when accepting an offer created the order',
  })
  orderId?: number | null;
}

export class WigglypopTradeOfferEntity {
  @ApiProperty() id: number;
  @ApiProperty() listingId: number;
  @ApiProperty({ type: WigglypopPersonRef }) proposer: WigglypopPersonRef;
  @ApiProperty() offeredPokemonKey: string;

  @ApiPropertyOptional({
    type: WigglypopListingMonEntity,
    nullable: true,
    description: 'Snapshot of the offered mon, taken from the proposer\'s live PC',
  })
  offeredSnapshot: unknown | null;

  @ApiProperty({ example: 'pendiente' }) status: string;
  @ApiProperty() createdAt: Date;
  @ApiPropertyOptional({ nullable: true }) respondedAt: Date | null;

  @ApiPropertyOptional({ type: WigglypopListingEntity })
  listing?: WigglypopListingEntity;
}

export class WigglypopReviewEntity {
  @ApiProperty() id: number;
  @ApiProperty() orderId: number;
  @ApiProperty({ type: WigglypopPersonRef }) reviewer: WigglypopPersonRef;
  @ApiProperty() rating: number;
  @ApiPropertyOptional({ nullable: true }) body: string | null;
  @ApiProperty() createdAt: Date;
}

// Every field here is DERIVED from real orders and reviews. A seller with no completed sales
// gets rating: null and sales: 0 — the API says "no data" rather than inventing a 5-star
// newcomer.
export class WigglypopSellerEntity {
  @ApiProperty({ type: WigglypopPersonRef }) seller: WigglypopPersonRef;

  @ApiProperty({
    nullable: true,
    example: 4.6,
    description: 'Mean of real reviews, 1 decimal. null when there are none.',
  })
  rating: number | null;

  @ApiProperty({ example: 12, description: 'Count of completed order lines' })
  sales: number;

  @ApiProperty({ example: 3 }) reviewCount: number;

  @ApiProperty({ example: 2, description: 'Listings currently activo' })
  activeListings: number;

  @ApiProperty({ type: WigglypopReviewEntity, isArray: true })
  reviews: WigglypopReviewEntity[];
}

export class WigglypopWatchlistEntity {
  @ApiProperty({ type: WigglypopListingEntity, isArray: true })
  items: WigglypopListingEntity[];

  @ApiProperty() total: number;
}

export class WigglypopWatchResultEntity {
  @ApiProperty() watching: boolean;
}

export class WigglypopSuccessEntity {
  @ApiProperty() success: boolean;
}
