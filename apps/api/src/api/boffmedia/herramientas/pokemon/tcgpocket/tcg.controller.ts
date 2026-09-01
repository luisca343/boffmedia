import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  HttpStatus,
  Res,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import { Public } from '@api/_utils/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TcgFacadeService } from './tcg.facade.service';
import { TcgSeries } from './entities/tcg-series.entity';
import { TcgSet } from './entities/tcg-set.entity';
import { TcgCard } from './entities/tcg-card.entity';
import { SeriesCardsGroup } from './entities/series-cards-grouped.entity';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';
import { AddUserCardDto, UpdateUserCardQuantityDto } from './dto/user-card.dto';
import { TcgUserCard, TcgUserCardHistory } from './entities/user-card.entity';
import { Logger } from 'nestjs-pino';
import {
  CurrentUser,
  AuthPrincipal,
} from '@api/_utils/decorators/current-user.decorator';
import { RequireSession } from '@api/_utils/decorators/require-session.decorator';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { TcgSyncRequestDto, TcgSyncStatus } from './dto/tcg-sync.dto';
import { DesktopOrUserAuthGuard } from '@api/packs/guards/desktop-or-user-auth.guard';

@ApiTags('BoffMedia 🛠 | Pokemon TCG Pocket')
@Public()
@Controller('tools/ptcgp')
export class TcgController {
  constructor(
    private readonly logger: Logger,
    private readonly tcgFacade: TcgFacadeService,
  ) {}

  // ==================== HELPER METHODS ====================

  // Rows reach this controller in TWO shapes and always have: Drizzle selects
  // return the schema's JS property names (`setId`, `nameEn`, `cardCountTotal`),
  // while the fetch/merge services build the external API's snake_case. Reading
  // only one of them yields `undefined`, and `undefined` is DROPPED by
  // JSON.stringify — which is how `/series/:id/sets` came to answer
  // `{id, logo, symbol}` with no name and no counts at all, and how every card
  // lost its `setId` (the client builds its artwork fallback URL from that, so it
  // requested `/cards/undefined/...`). Read both, everywhere.
  private either<T>(row: any, camel: string, snake: string): T | undefined {
    return row?.[camel] ?? row?.[snake];
  }

  /** A set's name in the requested locale, whichever shape the row arrived in. */
  private setName(set: any, locale: string): string {
    const localized =
      locale === 'es'
        ? (set?.nameEs ?? set?.name_es)
        : (set?.nameEn ?? set?.name_en);
    return localized || set?.nameEn || set?.name_en || set?.id;
  }

  private safeParse(jsonString: string | null): any {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch (_error: any) {
      return null;
    }
  }

  private parseCardData(card: any, locale: string): TcgCard {
    // Artwork falls back across locales, and a card without any is still a card.
    //
    // This used to test `image_es` regardless of the locale asked for and return
    // `null` when it was empty, so every card whose ES artwork was missing became
    // a null hole in the array the clients map over — which is why cards vanished
    // from the tool. tcgdex genuinely ships only one locale's asset for many
    // promos, so that condition is normal, not an error. (The fallback also read
    // `card.image_local_en`, a key the repository never selects: it aliases the
    // columns to `image_en` / `image_es`.)
    const image =
      card[`image_${locale}`] ?? card.image_en ?? card.image_es ?? null;

    if (!image) {
      this.logger.warn(`[TCG] No artwork stored for card ${card.id}`);
    }

    return {
      id: card.id,
      setId: this.either<string>(card, 'setId', 'set_id')!,
      setName: card[`set_name_${locale}`] || card.set_name_en,
      localId: this.either<string>(card, 'localId', 'local_id')!,
      name: card[`name_${locale}`] || card.name_en,
      image,
      category: card.category,
      illustrator: card.illustrator,
      rarity: card.rarity,
      hp: card.hp,
      stage: card.stage,
      description: card[`description_${locale}`] || card.description_en,
      updated: card.updated,
      retreat: card.retreat,

      types: this.safeParse(card.types),
      weaknesses: this.safeParse(card.weaknesses),
      attacks: this.safeParse(card.attacks),
      boosters: this.safeParse(card.boosters),
      variants: this.safeParse(card.variants),
      legal: this.safeParse(card.legal),
    };
  }

  // ==================== DATABASE OPERATIONS ====================

  @Get('series')
  @ApiOperation({ summary: 'Get all series' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Series retrieved successfully from database.',
    type: [TcgSeries],
  })
  async getAllSeries(): Promise<TcgSeries[]> {
    return this.tcgFacade.getAllSeries();
  }

  @Get('series/:seriesId/sets')
  @ApiOperation({ summary: 'Get sets for series' })
  @ApiParam({ name: 'seriesId', description: 'Series ID', example: 'tcgp' })
  @ApiQuery({
    name: 'locale',
    description: 'Language locale (en|es)',
    required: false,
    example: 'en',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sets retrieved successfully from database.',
    type: [TcgSet],
  })
  async getSetsForSeriesFromDb(
    @Param('seriesId') seriesId: string,
    @Query('locale') locale: string = 'en',
  ): Promise<TcgSet[]> {
    const sets = await this.tcgFacade.getSetsForSeriesFromDb(seriesId);
    return sets.map((set) => ({
      id: set.id,
      name: this.setName(set, locale),
      logo: set.logo,
      symbol: set.symbol,
      cardCountOfficial:
        this.either<number>(set, 'cardCountOfficial', 'card_count_official') ??
        0,
      cardCountTotal:
        this.either<number>(set, 'cardCountTotal', 'card_count_total') ?? 0,
    }));
  }

  @Get('sets/:setId/cards')
  @ApiOperation({ summary: 'Get cards for set' })
  @ApiParam({ name: 'setId', description: 'Set ID', example: 'A1' })
  @ApiQuery({
    name: 'locale',
    description: 'Language locale (en|es)',
    required: false,
    example: 'en',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cards retrieved successfully from database.',
    type: [TcgCard],
  })
  async getCardsForSetFromDb(
    @Param('setId') setId: string,
    @Query('locale') locale: string = 'en',
  ): Promise<TcgCard[]> {
    const cards = await this.tcgFacade.getCardsForSetFromDb(setId);
    return cards.map((card) => this.parseCardData(card, locale));
  }

  @Get('cards/:cardId')
  @ApiOperation({ summary: 'Get card by ID' })
  @ApiParam({ name: 'cardId', description: 'Card ID', example: 'tcgp-A1-001' })
  @ApiQuery({
    name: 'locale',
    description: 'Language locale (en|es)',
    required: false,
    example: 'en',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Card retrieved successfully from database.',
    type: TcgCard,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Card not found.',
  })
  async getCardById(
    @Param('cardId') cardId: string,
    @Query('locale') locale: string = 'en',
  ): Promise<TcgCard> {
    const card = await this.tcgFacade.getCardById(cardId);
    return this.parseCardData(card, locale);
  }

  @Get('series/:seriesId/cards/grouped')
  @ApiOperation({ summary: 'Get all cards for series grouped by set' })
  @ApiParam({ name: 'seriesId', description: 'Series ID', example: 'tcgp' })
  @ApiQuery({
    name: 'locale',
    description: 'Language locale (en|es)',
    required: false,
    example: 'en',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'All cards from series retrieved successfully from database, grouped by set.',
    type: [SeriesCardsGroup],
  })
  async getAllCardsForSeriesFromDb(
    @Param('seriesId') seriesId: string,
    @Query('locale') locale: string = 'en',
  ): Promise<SeriesCardsGroup[]> {
    const sets = await this.tcgFacade.getSetsForSeriesFromDb(seriesId);
    const groupedCards = [];

    for (const set of sets) {
      const cards = await this.tcgFacade.getCardsForSetFromDb(set.id);
      const mappedCards = cards.map((card) => this.parseCardData(card, locale));

      groupedCards.push({
        setId: set.id,
        setName: this.setName(set, locale),
        cardCount: mappedCards.length,
        cards: mappedCards,
      });
    }

    return groupedCards;
  }

  @Get('series/:seriesId/cards')
  @ApiOperation({ summary: 'Get all cards for series ungrouped' })
  @ApiParam({ name: 'seriesId', description: 'Series ID', example: 'tcgp' })
  @ApiQuery({
    name: 'locale',
    description: 'Language locale (en|es)',
    required: false,
    example: 'en',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'All cards from series retrieved successfully from database, ungrouped.',
    type: [TcgCard],
  })
  async getAllCardsForSeriesUngroupedFromDb(
    @Param('seriesId') seriesId: string,
    @Query('locale') locale: string = 'en',
  ): Promise<TcgCard[]> {
    const sets = await this.tcgFacade.getSetsForSeriesFromDb(seriesId);
    const allCards = [];

    for (const set of sets) {
      const cards = await this.tcgFacade.getCardsForSetFromDb(set.id);
      const mappedCards = cards.map((card) => this.parseCardData(card, locale));
      allCards.push(...mappedCards);
    }

    return allCards;
  }

  // ==================== FETCH OPERATIONS (EXTERNAL API) ====================

  @Get('fetch/series')
  @ApiOperation({ summary: 'Fetch and store series' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Series fetched and stored successfully.',
    type: SuccessResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_GATEWAY,
    description: 'Failed to fetch series from external API.',
  })
  async fetchAndStoreSeries(): Promise<SuccessResponse> {
    return this.tcgFacade.fetchAndStoreSeries();
  }

  @Get('fetch/series/:seriesId/sets')
  @ApiOperation({ summary: 'Fetch sets for series' })
  @ApiParam({ name: 'seriesId', description: 'Series ID', example: 'A1' })
  @ApiQuery({
    name: 'locale',
    description: 'Language locale (en|es)',
    required: false,
    example: 'en',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sets fetched successfully from API.',
    type: [TcgSet],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Series not found.',
  })
  async fetchSetsForSeries(
    @Param('seriesId') seriesId: string,
    @Query('locale') locale: string = 'en',
  ): Promise<TcgSet[]> {
    return this.tcgFacade.fetchSetsForSeries(seriesId, locale);
  }

  @Get('fetch/series/:seriesId/sets/store')
  @ApiOperation({ summary: 'Fetch and store sets for series' })
  @ApiParam({ name: 'seriesId', description: 'Series ID', example: 'A1' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sets fetched and stored successfully (both languages).',
    type: [TcgSet],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Series not found.',
  })
  async fetchAndStoreSetsForSeries(
    @Param('seriesId') seriesId: string,
  ): Promise<TcgSet[]> {
    return this.tcgFacade.fetchSetsForSeriesBothLanguages(seriesId);
  }

  @Get('fetch/sets/:setId/cards')
  @ApiOperation({ summary: 'Fetch cards for set' })
  @ApiParam({ name: 'setId', description: 'Set ID', example: 'A1' })
  @ApiQuery({
    name: 'locale',
    description: 'Language locale (en|es)',
    required: false,
    example: 'en',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cards fetched successfully from API.',
    type: [TcgCard],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Set not found.',
  })
  async fetchCardsForSet(
    @Param('setId') setId: string,
    @Query('locale') locale: string = 'en',
  ): Promise<TcgCard[]> {
    return await this.tcgFacade.fetchAndStoreCardsForSet(setId, locale);
  }

  @Get('fetch/sets/:setId/cards/store')
  @ApiOperation({ summary: 'Fetch and store cards for set' })
  @ApiParam({ name: 'setId', description: 'Set ID', example: 'A1' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cards fetched and stored successfully.',
    type: [TcgCard],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Set not found.',
  })
  async fetchAndStoreCardsForSet(
    @Param('setId') setId: string,
  ): Promise<TcgCard[]> {
    return await this.tcgFacade.fetchAndStoreCardsForSetBothLanguages(setId);
  }

  // ==================== FETCH BATCH OPERATIONS ====================

  @Get('fetch/series/:seriesId/cards/store')
  @ApiOperation({ summary: 'Fetch and store all cards for series' })
  @ApiParam({ name: 'seriesId', description: 'Series ID', example: 'tcgp' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cards fetched and stored for all sets in series.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          setId: { type: 'string' },
          cards: { type: 'array' },
          error: { type: 'string', nullable: true },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to fetch sets or cards.',
  })
  async fetchAndStoreAllCardsForSeries(
    @Param('seriesId') seriesId: string,
  ): Promise<
    Array<{ setId: string; cards: any[] | null; error: string | null }>
  > {
    let sets;

    try {
      sets = await this.tcgFacade.fetchSetsForSeriesBothLanguages(seriesId);
    } catch (err: any) {
      this.logger.error(
        `[TCG] Failed to fetch sets for series ${seriesId}:`,
        err,
      );
      return [
        {
          setId: seriesId,
          cards: null,
          error: `Failed to fetch sets for series ${seriesId}: ${err?.message || err}`,
        },
      ];
    }

    const results = [];

    for (const set of sets) {
      let cards = null;
      let error = null;

      this.logger.log(`[TCG] Fetching cards for set ${set.id}...`);

      try {
        cards = await this.tcgFacade.fetchAndStoreCardsForSetBothLanguages(
          set.id,
        );
      } catch (err: any) {
        error = err?.message || err;
        this.logger.error(
          `[TCG] Failed to fetch/store cards for set ${set.id}:`,
          err,
        );
      }

      // If cards is null or empty, but error exists, try fetching EN only as fallback
      if ((!cards || cards.length === 0) && error) {
        try {
          cards = await this.tcgFacade.fetchAndStoreCardsForSet(set.id, 'en');
          error = `ES fetch failed, but EN succeeded.`;
        } catch (err2) {
          error += ` | EN fetch also failed: ${(err2 as any)?.message || err2}`;
        }
      }

      results.push({ setId: set.id, cards, error });
    }

    return results;
  }
  // ==================== SELECTIVE SYNC (ADMIN) ====================

  // `@RequireSession()` is what actually locks these down: the controller is
  // `@Public()` as a whole, which would turn a route-level `@UseGuards(JwtAuthGuard)`
  // into a no-op (see jwt-auth.guard.ts). It flips the public flag back off so the
  // global guard authenticates, and RolesGuard then sees a populated `req.user`.

  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @Get('admin/sync/status')
  @ApiOperation({
    summary: 'Compare the stored catalogue against the remote one',
    description:
      'Per-set counts of cards and artwork, stored versus available, so the ' +
      'admin screen can show what is missing, partial or already up to date ' +
      'before anything is downloaded.',
  })
  @ApiQuery({
    name: 'seriesId',
    required: false,
    description: 'Series to inspect',
    example: 'tcgp',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sync status retrieved.',
    type: TcgSyncStatus,
  })
  async getSyncStatus(
    @Query('seriesId') seriesId?: string,
  ): Promise<TcgSyncStatus> {
    return this.tcgFacade.getSyncStatus(seriesId);
  }

  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @Post('admin/sync/stream')
  // A stream is a 200, not a 201: nothing is created at this URL.
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Run a selective sync, streaming progress via SSE',
    description:
      'Each selected data type (series, sets, cards, images) runs as its own ' +
      'stage over the selected sets. A set that fails is reported and the run ' +
      'continues, so a partial failure never forces a full restart. Events are ' +
      'JSON objects with a `type` field: start, stage, set, item or done.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SSE stream of sync progress events.',
  })
  async streamSync(
    @Body() dto: TcgSyncRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // Nginx buffers SSE into uselessness otherwise: the whole run would arrive
    // as one blob at the end, which is exactly the experience being replaced.
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Closing the browser tab must stop the work, not leave it walking every
    // remaining set at 250ms a card.
    let cancelled = false;
    res.on('close', () => {
      cancelled = true;
    });

    try {
      for await (const event of this.tcgFacade.runSync(dto, () => cancelled)) {
        if (cancelled) break;
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } catch (error: any) {
      this.logger.error('[TCG] Sync stream failed:', error);
      if (!cancelled) {
        res.write(
          `data: ${JSON.stringify({
            type: 'done',
            cancelled: false,
            durationMs: 0,
            counts: { downloaded: 0, updated: 0, skipped: 0, failed: 1 },
            failures: [
              {
                stage: 'series',
                scope: dto.seriesId || 'tcgp',
                // First line only: a driver error carries the whole statement.
                message: String(error?.message ?? error).split('\n')[0].slice(0, 240),
              },
            ],
          })}\n\n`,
        );
      }
    } finally {
      res.end();
    }
  }

  // ==================== USER CARDS OPERATIONS ====================

  // These four are reachable from the website AND from the desktop app, whose
  // token is a different type with its own revocation counter — so they take
  // `DesktopOrUserAuthGuard` instead of `@RequireSession()`. Note the guard only
  // runs because the controller is `@Public()`: `@RequireSession()` would make
  // the global JwtAuthGuard reject the app's token first.

  @Get('users/:userName/cards')
  @ApiOperation({ summary: 'Get user cards' })
  @ApiParam({ name: 'userName', description: 'User Name', example: 'user123' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User cards retrieved successfully.',
    type: [TcgUserCard],
  })
  async getUserCards(
    @Param('userName') userName: string,
  ): Promise<TcgUserCard[]> {
    return this.tcgFacade.getUserCards(userName);
  }

  @UseGuards(DesktopOrUserAuthGuard)
  @Post('users/cards')
  @ApiOperation({ summary: 'Add card to user collection' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Card added to user collection successfully.',
    type: SuccessResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or card does not exist.',
  })
  async addUserCard(
    @Body() addUserCardDto: AddUserCardDto,
    @CurrentUser() user: AuthPrincipal,
  ): Promise<SuccessResponse> {
    // The collection belongs to the caller. `userId` must never come from the
    // body, or one player can stuff cards into another player's collection.
    return this.tcgFacade.addUserCard({
      ...addUserCardDto,
      userId: user.userId,
    });
  }

  @UseGuards(DesktopOrUserAuthGuard)
  @Put('users/:userId/cards/:cardId')
  @ApiOperation({
    summary: 'Set user card quantity (upsert)',
    description:
      'Makes the collection entry be exactly this quantity: creates it when ' +
      'absent, removes it at 0. Idempotent by design — the desktop app queues ' +
      'these while offline and replays them at least once.',
  })
  @ApiParam({ name: 'userId', description: 'User ID', example: 'user123' })
  @ApiParam({ name: 'cardId', description: 'Card ID', example: 'tcgp-A1-001' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User card quantity set successfully.',
    type: SuccessResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The card does not exist.',
  })
  async updateUserCardQuantity(
    @Param('userId') _userId: number,
    @Param('cardId') cardId: string,
    @Body() updateDto: UpdateUserCardQuantityDto,
    @CurrentUser() user: AuthPrincipal,
  ): Promise<SuccessResponse> {
    return this.tcgFacade.updateUserCardQuantity(
      user.userId,
      cardId,
      updateDto,
    );
  }

  @UseGuards(DesktopOrUserAuthGuard)
  @Delete('users/:userId/cards/:cardId')
  @ApiOperation({ summary: 'Remove card from user collection' })
  @ApiParam({ name: 'userId', description: 'User ID', example: 'user123' })
  @ApiParam({ name: 'cardId', description: 'Card ID', example: 'tcgp-A1-001' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Card removed from user collection successfully.',
    type: SuccessResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User does not own this card.',
  })
  async removeUserCard(
    @Param('userId') _userId: number,
    @Param('cardId') cardId: string,
    @CurrentUser() user: AuthPrincipal,
  ): Promise<SuccessResponse> {
    return this.tcgFacade.removeUserCard(user.userId, cardId);
  }

  @UseGuards(DesktopOrUserAuthGuard)
  @Get('users/:userId/cards/history')
  @ApiOperation({ summary: 'Get user card history' })
  @ApiParam({ name: 'userId', description: 'User ID (ignored, uses authenticated user)', example: 'user123' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User card history retrieved successfully.',
    type: [TcgUserCardHistory],
  })
  async getUserCardHistory(
    @Param('userId') _userId: number,
    @CurrentUser() user: AuthPrincipal,
  ): Promise<TcgUserCardHistory[]> {
    // This route is now protected and returns only the authenticated user's history,
    // regardless of the userId parameter. The parameter is kept for backward compatibility
    // with existing client paths, but is ignored to prevent IDOR.
    return this.tcgFacade.getUserCardHistory(user.userId);
  }

  @Get('migrate')
  @ApiOperation({ summary: 'Migrate TCG data to new schema' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'TCG data migration completed successfully.',
    type: SuccessResponse,
  })
  async migrateData(): Promise<SuccessResponse> {
    return await this.tcgFacade.migrateOldUserCards();
  }
}
