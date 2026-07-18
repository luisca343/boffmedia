import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '@api/_utils/decorators/public.decorator';
import { GameOrUserAuthGuard } from '@api/_utils/guards/game-or-user-auth.guard';
import { resolveActor } from '@api/_utils/auth/actor';
import { WigglypopFacadeService } from './wigglypop.facade.service';
import {
  CreateBidDto,
  CreateListingDto,
  CreateOfferDto,
  CreateOrderDto,
  CreateReviewDto,
  CreateTradeDto,
  DeleteListingDto,
  ListListingsQueryDto,
  OrderActorDto,
  RespondOfferDto,
  RespondTradeDto,
  UpdateListingDto,
  ValuateDto,
  WatchlistDto,
} from './dto/wigglypop.dto';
import {
  WigglypopBidEntity,
  WigglypopItemCatalogEntity,
  WigglypopListingEntity,
  WigglypopListingListEntity,
  WigglypopOfferEntity,
  WigglypopOrderEntity,
  WigglypopReviewEntity,
  WigglypopSellerEntity,
  WigglypopSuccessEntity,
  WigglypopTradeOfferEntity,
  WigglypopValuationEntity,
  WigglypopWatchResultEntity,
  WigglypopWatchlistEntity,
} from './entities/wigglypop.entity';

@ApiTags('SmartRotom | Wigglypop')
@Public()
@Controller('smartrotom/wigglypop')
export class WigglypopController {
  constructor(private readonly wigglypop: WigglypopFacadeService) {}

  // ==================== LISTINGS ====================

  @Get('listings')
  @ApiOperation({
    summary: 'Browse the market',
    description:
      'Paginated. `sort` accepts relevance | price-asc | price-desc | iv | recent | ending. ' +
      '`types` is accepted but not applied — the game server exposes no Pokémon type data.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: WigglypopListingListEntity })
  async listListings(
    @Query() query: ListListingsQueryDto,
  ): Promise<WigglypopListingListEntity> {
    return this.wigglypop.listListings(query);
  }

  @Get('listings/:id')
  @ApiOperation({ summary: 'Get one listing (and count the view)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: WigglypopListingEntity })
  async getListing(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WigglypopListingEntity> {
    return this.wigglypop.getListing(id);
  }

  @Post('listings')
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List something for sale',
    description:
      "Every Pokémon is verified against the seller's LIVE PC before the listing exists: the " +
      'mon must still be at the given (box, index) AND still hash to the given pokemonKey.',
  })
  @ApiBody({ type: CreateListingDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: WigglypopListingEntity })
  async createListing(
    @Body() dto: CreateListingDto,
    @Req() req: Request,
  ): Promise<WigglypopListingEntity> {
    return this.wigglypop.createListing(dto, resolveActor(req));
  }

  @Patch('listings/:id')
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit a listing (price, note, status)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateListingDto })
  @ApiResponse({ status: HttpStatus.OK, type: WigglypopListingEntity })
  async updateListing(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateListingDto,
    @Req() req: Request,
  ): Promise<WigglypopListingEntity> {
    return this.wigglypop.updateListing(id, dto, resolveActor(req));
  }

  @Delete('listings/:id')
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a listing that has not sold' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: DeleteListingDto })
  @ApiResponse({ status: HttpStatus.OK, type: WigglypopSuccessEntity })
  async deleteListing(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DeleteListingDto,
    @Req() req: Request,
  ): Promise<WigglypopSuccessEntity> {
    return this.wigglypop.deleteListing(id, dto.actorUuid, resolveActor(req));
  }

  @Get('listings/:id/bids')
  @ApiOperation({ summary: 'Bid history for an auction, highest first' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: [WigglypopBidEntity] })
  async listBids(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WigglypopBidEntity[]> {
    return this.wigglypop.listBids(id);
  }

  // ==================== MARKET DATA ====================

  @Get('item-catalog')
  @ApiOperation({
    summary: 'The item catalogue that backs the sell flow’s item picker',
    description:
      'The game server exposes no bag API, so a seller DECLARES what they are selling by ' +
      'picking from this list rather than from a real inventory. Item ownership is therefore ' +
      'unverified by design — which is why an item sale still settles through escrow.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [WigglypopItemCatalogEntity] })
  async listItemCatalog(): Promise<WigglypopItemCatalogEntity[]> {
    return this.wigglypop.listItemCatalog();
  }

  @Get('price-history/:dex')
  @ApiOperation({
    summary: 'What players have actually paid for a species, oldest first',
    description:
      'DERIVED from completed order lines — there is no price-history table. Returns [] when ' +
      'there are fewer than 2 real sales: a fabricated curve would be worse than none.',
  })
  @ApiParam({ name: 'dex', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: [Number] })
  async priceHistory(
    @Param('dex', ParseIntPipe) dex: number,
  ): Promise<number[]> {
    return this.wigglypop.priceHistory(dex);
  }

  @Post('valuate')
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Value a Pokémon or a stack of items',
    description:
      'Pure and deterministic — the same Pokémon always values the same. Never charges anyone.',
  })
  @ApiBody({ type: ValuateDto })
  @ApiResponse({ status: HttpStatus.OK, type: WigglypopValuationEntity })
  async valuate(@Body() dto: ValuateDto): Promise<WigglypopValuationEntity> {
    return this.wigglypop.valuate(dto);
  }

  @Get('sellers/:uuid')
  @ApiOperation({
    summary: 'A seller’s public reputation',
    description:
      'rating/sales/reviews are DERIVED from real orders and reviews. A seller with no sales ' +
      'gets sales: 0 and rating: null — never an invented score.',
  })
  @ApiParam({ name: 'uuid', type: String })
  @ApiResponse({ status: HttpStatus.OK, type: WigglypopSellerEntity })
  async getSeller(@Param('uuid') uuid: string): Promise<WigglypopSellerEntity> {
    return this.wigglypop.getSeller(uuid);
  }

  // ==================== WATCHLIST ====================

  @Get('watchlist/:uuid')
  @ApiOperation({ summary: 'The listings a player is watching' })
  @ApiParam({ name: 'uuid', type: String })
  @ApiResponse({ status: HttpStatus.OK, type: WigglypopWatchlistEntity })
  async getWatchlist(
    @Param('uuid') uuid: string,
  ): Promise<WigglypopWatchlistEntity> {
    return this.wigglypop.getWatchlist(uuid);
  }

  @Put('watchlist')
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Watch or unwatch a listing' })
  @ApiBody({ type: WatchlistDto })
  @ApiResponse({ status: HttpStatus.OK, type: WigglypopWatchResultEntity })
  async setWatching(
    @Body() dto: WatchlistDto,
    @Req() req: Request,
  ): Promise<WigglypopWatchResultEntity> {
    return this.wigglypop.setWatching(dto, resolveActor(req));
  }

  // ==================== ORDERS ====================

  @Post('orders')
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'THE BUY',
    description:
      'Moves REAL StarBank money: buyer → the market escrow account. What happens next depends ' +
      'on WIGGLYPOP_ATOMIC_CUSTODY. Today (flag off) the order parks at `escrow`, the players ' +
      'hand the Pokémon over in-game, and the seller is only paid when the buyer confirms.',
  })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: WigglypopOrderEntity })
  async createOrder(
    @Body() dto: CreateOrderDto,
    @Req() req: Request,
  ): Promise<WigglypopOrderEntity> {
    return this.wigglypop.createOrder(dto, resolveActor(req));
  }

  @Get('orders/user/:uuid')
  @ApiOperation({
    summary:
      'A player’s orders — both the ones they bought and the ones they sold',
  })
  @ApiParam({ name: 'uuid', type: String })
  @ApiResponse({ status: HttpStatus.OK, type: [WigglypopOrderEntity] })
  async getUserOrders(
    @Param('uuid') uuid: string,
  ): Promise<WigglypopOrderEntity[]> {
    return this.wigglypop.getUserOrders(uuid);
  }

  @Post('orders/:id/transferred')
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'The seller marks the in-game hand-off done',
    description: 'A claim, not a settlement. No money moves here.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: OrderActorDto })
  @ApiResponse({ status: HttpStatus.OK, type: WigglypopOrderEntity })
  async markTransferred(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: OrderActorDto,
    @Req() req: Request,
  ): Promise<WigglypopOrderEntity> {
    return this.wigglypop.markTransferred(id, dto.actorUuid, resolveActor(req));
  }

  @Post('orders/:id/confirm')
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'The buyer confirms receipt — this is what pays the seller',
    description: 'Releases the escrow: escrow → seller, per line. Idempotent.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: OrderActorDto })
  @ApiResponse({ status: HttpStatus.OK, type: WigglypopOrderEntity })
  async confirmOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: OrderActorDto,
    @Req() req: Request,
  ): Promise<WigglypopOrderEntity> {
    return this.wigglypop.confirmOrder(id, dto.actorUuid, resolveActor(req));
  }

  @Post('orders/:id/cancel')
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel and refund the escrow back to the buyer' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: OrderActorDto })
  @ApiResponse({ status: HttpStatus.OK, type: WigglypopOrderEntity })
  async cancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: OrderActorDto,
    @Req() req: Request,
  ): Promise<WigglypopOrderEntity> {
    return this.wigglypop.cancelOrder(id, dto.actorUuid, resolveActor(req));
  }

  // ==================== BIDS ====================

  @Post('bids')
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bid on an auction',
    description:
      'No money moves. The auction closer turns the winning bid into a real escrowed order.',
  })
  @ApiBody({ type: CreateBidDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: WigglypopBidEntity })
  async createBid(
    @Body() dto: CreateBidDto,
    @Req() req: Request,
  ): Promise<WigglypopBidEntity> {
    return this.wigglypop.createBid(dto, resolveActor(req));
  }

  // ==================== OFFERS ====================

  @Post('offers')
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Make an offer on a listing' })
  @ApiBody({ type: CreateOfferDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: WigglypopOfferEntity })
  async createOffer(
    @Body() dto: CreateOfferDto,
    @Req() req: Request,
  ): Promise<WigglypopOfferEntity> {
    return this.wigglypop.createOffer(dto, resolveActor(req));
  }

  @Get('offers/seller/:uuid')
  @ApiOperation({ summary: 'Offers waiting on a seller' })
  @ApiParam({ name: 'uuid', type: String })
  @ApiResponse({ status: HttpStatus.OK, type: [WigglypopOfferEntity] })
  async getSellerOffers(
    @Param('uuid') uuid: string,
  ): Promise<WigglypopOfferEntity[]> {
    return this.wigglypop.getSellerOffers(uuid);
  }

  @Post('offers/:id/accept')
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Accept an offer — creates an order at the offered price',
    description:
      'Runs through the ordinary purchase path, so an accepted offer settles through exactly ' +
      'the same escrow and custody code as any other buy.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: RespondOfferDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: WigglypopOrderEntity })
  async acceptOffer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RespondOfferDto,
    @Req() req: Request,
  ): Promise<WigglypopOrderEntity> {
    return this.wigglypop.acceptOffer(id, dto.actorUuid, resolveActor(req));
  }

  @Post('offers/:id/reject')
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject an offer' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: RespondOfferDto })
  @ApiResponse({ status: HttpStatus.OK, type: WigglypopOfferEntity })
  async rejectOffer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RespondOfferDto,
    @Req() req: Request,
  ): Promise<WigglypopOfferEntity> {
    return this.wigglypop.rejectOffer(id, dto.actorUuid, resolveActor(req));
  }

  // ==================== TRADES ====================

  @Post('trades')
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Propose a trade',
    description:
      "The offered Pokémon is verified against the proposer's live PC, exactly like a listed one.",
  })
  @ApiBody({ type: CreateTradeDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: WigglypopTradeOfferEntity })
  async createTrade(
    @Body() dto: CreateTradeDto,
    @Req() req: Request,
  ): Promise<WigglypopTradeOfferEntity> {
    return this.wigglypop.createTrade(dto, resolveActor(req));
  }

  @Get('trades/seller/:uuid')
  @ApiOperation({ summary: 'Trade proposals waiting on a seller' })
  @ApiParam({ name: 'uuid', type: String })
  @ApiResponse({ status: HttpStatus.OK, type: [WigglypopTradeOfferEntity] })
  async getSellerTrades(
    @Param('uuid') uuid: string,
  ): Promise<WigglypopTradeOfferEntity[]> {
    return this.wigglypop.getSellerTrades(uuid);
  }

  @Post('trades/:id/accept')
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Accept a trade proposal',
    description:
      'Marks the swap agreed and takes the listing off the shelf. The two players swap in-game ' +
      'themselves — a two-sided swap cannot be executed until the plugin ships /takepokemon.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: RespondTradeDto })
  @ApiResponse({ status: HttpStatus.OK, type: WigglypopTradeOfferEntity })
  async acceptTrade(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RespondTradeDto,
    @Req() req: Request,
  ): Promise<WigglypopTradeOfferEntity> {
    return this.wigglypop.acceptTrade(id, dto.actorUuid, resolveActor(req));
  }

  @Post('trades/:id/reject')
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a trade proposal' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: RespondTradeDto })
  @ApiResponse({ status: HttpStatus.OK, type: WigglypopTradeOfferEntity })
  async rejectTrade(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RespondTradeDto,
    @Req() req: Request,
  ): Promise<WigglypopTradeOfferEntity> {
    return this.wigglypop.rejectTrade(id, dto.actorUuid, resolveActor(req));
  }

  // ==================== REVIEWS ====================

  @Post('reviews')
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Review a completed order',
    description:
      'Only the real buyer of a completed order may review, and only once. The seller is taken ' +
      'from the order line, never from the request.',
  })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: WigglypopReviewEntity })
  async createReview(
    @Body() dto: CreateReviewDto,
    @Req() req: Request,
  ): Promise<WigglypopReviewEntity> {
    return this.wigglypop.createReview(dto, resolveActor(req));
  }
}
