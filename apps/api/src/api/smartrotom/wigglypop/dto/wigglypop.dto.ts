import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { BadRequestException } from '@nestjs/common';
import { BaseDto } from '@api/_utils/dto/base.dto';

// Every @Body DTO here extends BaseDto. Two reasons, both load-bearing: ValidationPipe runs
// with forbidNonWhitelisted, so without the inherited `server` field it 400s with "property
// server should not exist"; and MinecraftMiddleware 403s any non-GET under /smartrotom/*
// whose body.server !== MC_WORLD.

// `item` (singular) is what the sell flow sends for a one-stack item listing; `items` is the
// original spelling. Both mean the same thing and are stored as sent, so a listing reads back
// with the kind it was created with. Use isItemsKind() for every internal check.
export const LISTING_KINDS = ['mon', 'item', 'items', 'bundle'] as const;

export function isItemsKind(kind: string): boolean {
  return kind === 'items' || kind === 'item';
}
export const LISTING_FORMATS = ['fixed', 'auction', 'offer', 'trade'] as const;
// `status` is a plain varchar(16) in the DB, with no CHECK and no enum — adding a state here
// needs no migration. `reservado` is one an order puts a listing into while its escrow is
// pending: off the shelf, but not yet sold, and back to `activo` if the order is cancelled.
export const LISTING_STATUSES = [
  'activo',
  'reservado',
  'vendido',
  'cancelado',
  'pausado',
] as const;
export const RARITIES = ['comun', 'raro', 'epico', 'legendario'] as const;
// The feed's sort dropdown sends the hyphenated names. `price_asc`/`price_desc` are retained
// as accepted aliases so any existing caller keeps working.
export const LISTING_SORTS = [
  'relevance',
  'price-asc',
  'price-desc',
  'iv',
  'recent',
  'ending',
  // aliases
  'price_asc',
  'price_desc',
  'value',
] as const;

// A query string yields a bare string when a repeated key appears once and an array when it
// appears several times — `?rarities=raro` and `?rarities=raro&rarities=epico` arrive as
// different types. Normalise to an array (also accepting the CSV form) so every @IsArray()
// filter below holds for all three shapes.
const asStringArray = () =>
  Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (Array.isArray(value)) return value.map(String);
    return String(value)
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  });

// ─── Listings ─────────────────────────────────────────────────────────────────

// GET, so no BaseDto: MinecraftMiddleware only guards non-GET, and a query string carries
// no `server`.
export class ListListingsQueryDto {
  @ApiPropertyOptional({ description: 'Free-text match on title / species' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: LISTING_KINDS })
  @IsOptional()
  @IsIn(LISTING_KINDS as unknown as string[])
  kind?: string;

  @ApiPropertyOptional({ enum: LISTING_FORMATS })
  @IsOptional()
  @IsIn(LISTING_FORMATS as unknown as string[])
  format?: string;

  @ApiPropertyOptional({ enum: LISTING_STATUSES, default: 'activo' })
  @IsOptional()
  @IsIn(LISTING_STATUSES as unknown as string[])
  status?: string;

  @ApiPropertyOptional({ enum: RARITIES, isArray: true })
  @IsOptional()
  @asStringArray()
  @IsArray()
  rarities?: string[];

  @ApiPropertyOptional({
    isArray: true,
    type: String,
    description:
      'Pokémon types. Accepted and validated, but NOT applied: the Pixelmon /pc payload ' +
      'carries no type data, so there is nothing server-side to filter on. Deferred.',
  })
  @IsOptional()
  @asStringArray()
  @IsArray()
  types?: string[];

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  shinyOnly?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  legendaryOnly?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Only 6IV mons (sum of IVs === 186)',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  perfectOnly?: boolean;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMax?: number;

  @ApiPropertyOptional({ enum: LISTING_SORTS, default: 'recent' })
  @IsOptional()
  @IsIn(LISTING_SORTS as unknown as string[])
  sort?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 24;
}

/**
 * A Pokémon being put up (or offered in a trade).
 *
 * Only three fields matter to the SERVER: the slot (box/index) and the content hash. Everything
 * else the client sends — species, level, IVs, moves — is accepted so the payload validates,
 * but it is NOT trusted and NOT stored: the snapshot is rebuilt from the seller's LIVE PC. A
 * client that lies about a mon's IVs would otherwise mis-value it.
 *
 * The slot is accepted as either `box`/`index` or `sourceBox`/`sourceIndex` — the sell flow
 * sends the latter. One of the two pairs must be present.
 */
export class ListingMonInputDto {
  @ApiProperty({
    example: '1k3j9fz',
    description:
      'Content hash of the mon (dex|palette|nature|ability|ivs). Verified against the live PC.',
  })
  @IsString()
  @IsNotEmpty()
  pokemonKey: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'PC box. Alias of sourceBox.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  box?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Slot index. Alias of sourceIndex.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  index?: number;

  @ApiPropertyOptional({ example: 0, description: 'PC box the mon sits in' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sourceBox?: number;

  @ApiPropertyOptional({ example: 5, description: 'Slot index within the box' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sourceIndex?: number;

  // ── Accepted, but re-derived from the live PC. Declared only so that ValidationPipe (which
  //    runs with forbidNonWhitelisted) does not 400 the sell flow's payload.
  @ApiPropertyOptional() @IsOptional() @IsInt() dex?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() species?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() form?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() palette?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() level?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() nature?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ability?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gender?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() heldItem?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ball?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ot?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() caughtIn?: string;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  ivs?: number[];

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  evs?: number[];

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  stats?: number[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  moves?: (string | null)[];
}

/** Resolves the slot from whichever of the two accepted spellings the client used. */
export function resolveMonSlot(mon: ListingMonInputDto): {
  box: number;
  index: number;
} {
  const box = mon.box ?? mon.sourceBox;
  const index = mon.index ?? mon.sourceIndex;
  if (box === undefined || index === undefined) {
    throw new BadRequestException(
      'A Pokémon needs its PC slot — send box/index (or sourceBox/sourceIndex)',
    );
  }
  return { box, index };
}

/**
 * An item being put up. UNLIKE a Pokémon, this CANNOT be verified: the game server exposes no
 * way to read a player's bag, so the seller simply DECLARES what they are selling by picking
 * from the catalogue. Ownership is unverified by design, and the UI says so — which is exactly
 * why an item sale still settles through escrow, with the buyer confirming receipt.
 */
export class ListingItemInputDto {
  @ApiProperty({ example: 'pixelmon:master_ball' })
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  qty: number;

  @ApiPropertyOptional({
    example: 'Master Ball',
    description: 'Defaults to the catalog name when omitted',
  })
  @IsOptional()
  @IsString()
  itemName?: string;

  @ApiPropertyOptional({ example: 'pokeballs' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description:
      'Overrides the catalog reference price. Omit to price at catalog value.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  unitPrice?: number;
}

export class CreateListingDto extends BaseDto {
  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  sellerUuid: string;

  @ApiProperty({ enum: LISTING_KINDS })
  @IsIn(LISTING_KINDS as unknown as string[])
  kind: string;

  @ApiPropertyOptional({ enum: LISTING_FORMATS, default: 'fixed' })
  @IsOptional()
  @IsIn(LISTING_FORMATS as unknown as string[])
  format?: string;

  @ApiPropertyOptional({
    description: 'Defaults to the species name / item name when omitted',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    example: 5000,
    description: 'Asking price. For an auction this is the starting bid.',
  })
  @IsInt()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    type: ListingMonInputDto,
    description:
      'The single Pokémon, for kind=mon. Equivalent to sending a one-element `mons`.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ListingMonInputDto)
  mon?: ListingMonInputDto;

  @ApiPropertyOptional({
    type: ListingItemInputDto,
    description:
      'The single item stack, for kind=item. Equivalent to sending a one-element `items`.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ListingItemInputDto)
  item?: ListingItemInputDto;

  @ApiPropertyOptional({
    type: ListingMonInputDto,
    isArray: true,
    description:
      'Several Pokémon, for kind=bundle. Use `mon` for a single one.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListingMonInputDto)
  mons?: ListingMonInputDto[];

  @ApiPropertyOptional({ type: ListingItemInputDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListingItemInputDto)
  items?: ListingItemInputDto[];

  @ApiPropertyOptional({
    default: true,
    description:
      'Whether the sale settles through the market escrow. Sales always do today.',
  })
  @IsOptional()
  @IsBoolean()
  escrow?: boolean;

  // Auction-only
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 7,
    description:
      'How long an auction runs, in days. Converted to `endsAt` server-side — a client clock ' +
      'must never decide when an auction closes.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  durationDays?: number;

  @ApiPropertyOptional({
    description: 'Auction close time (ISO 8601). Prefer `durationDays`.',
  })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  minIncrement?: number;

  @ApiPropertyOptional({ description: 'Auction-only instant-win price' })
  @IsOptional()
  @IsInt()
  @Min(0)
  buyNow?: number;

  // Trade-only
  @ApiPropertyOptional({ type: String, isArray: true })
  @IsOptional()
  @IsArray()
  wants?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  tradePlus?: boolean;
}

export class UpdateListingDto extends BaseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ enum: LISTING_STATUSES })
  @IsOptional()
  @IsIn(LISTING_STATUSES as unknown as string[])
  status?: string;

  @ApiPropertyOptional({
    description: 'Who is editing. Must be the seller.',
  })
  @IsOptional()
  @IsUUID()
  actorUuid?: string;
}

export class DeleteListingDto extends BaseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  actorUuid?: string;
}

// ─── Valuation ────────────────────────────────────────────────────────────────

export class ValuateDto extends BaseDto {
  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsInt()
  @Min(1)
  dex?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  level?: number;

  @ApiPropertyOptional({
    type: [Number],
    example: [31, 31, 31, 31, 31, 31],
    description: 'Six IVs (HP, Atk, Def, SpA, SpD, Spe)',
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  ivs?: number[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  shiny?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  legendary?: boolean;

  @ApiPropertyOptional({ example: 'pixelmon:leftovers' })
  @IsOptional()
  @IsString()
  heldItem?: string;

  @ApiPropertyOptional({
    type: ListingItemInputDto,
    isArray: true,
    description:
      'Valuing items instead of a mon: sum of catalog ref_price × qty',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListingItemInputDto)
  items?: ListingItemInputDto[];
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export class WatchlistDto extends BaseDto {
  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  userUuid: string;

  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(1)
  listingId: number;

  @ApiProperty({ example: true, description: 'true = watch, false = unwatch' })
  @IsBoolean()
  watching: boolean;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export class OrderLineInputDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(1)
  listingId: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  qty?: number;
}

export class CreateOrderDto extends BaseDto {
  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  buyerUuid: string;

  @ApiProperty({ type: OrderLineInputDto, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderLineInputDto)
  lines: OrderLineInputDto[];
}

export class OrderActorDto extends BaseDto {
  @ApiPropertyOptional({
    description:
      'Who is acting. /transferred expects the seller, /confirm and /cancel the buyer.',
  })
  @IsOptional()
  @IsUUID()
  actorUuid?: string;
}

// ─── Bids / offers / trades ───────────────────────────────────────────────────

export class CreateBidDto extends BaseDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(1)
  listingId: number;

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  bidderUuid: string;

  @ApiProperty({ example: 5500 })
  @IsInt()
  @Min(1)
  amount: number;
}

export class CreateOfferDto extends BaseDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(1)
  listingId: number;

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  buyerUuid: string;

  @ApiProperty({ example: 4200 })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  qty?: number;
}

export class RespondOfferDto extends BaseDto {
  @ApiPropertyOptional({ description: 'Must be the seller of the listing' })
  @IsOptional()
  @IsUUID()
  actorUuid?: string;
}

export class CreateTradeDto extends BaseDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(1)
  listingId: number;

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  proposerUuid: string;

  @ApiProperty({
    description: "The offered mon, verified against the proposer's live PC",
  })
  @ValidateNested()
  @Type(() => ListingMonInputDto)
  offered: ListingMonInputDto;
}

export class RespondTradeDto extends BaseDto {
  @ApiPropertyOptional({ description: 'Must be the seller of the listing' })
  @IsOptional()
  @IsUUID()
  actorUuid?: string;
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export class CreateReviewDto extends BaseDto {
  @ApiProperty({ example: 7 })
  @IsInt()
  @Min(1)
  orderId: number;

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  reviewerUuid: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;
}
