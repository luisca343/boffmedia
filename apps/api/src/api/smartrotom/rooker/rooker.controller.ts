import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '@api/_utils/decorators/public.decorator';
import { RookerService } from './rooker.service';
import {
  ActorDto,
  BookmarksQueryDto,
  CreatePostDto,
  FeedQueryDto,
  FollowDto,
  InboxQueryDto,
  MeQueryDto,
  ProfilePostsQueryDto,
  ProfileQueryDto,
  ReactDto,
  SearchQueryDto,
  SuggestionsQueryDto,
  TrendsQueryDto,
  UpdateProfileDto,
  ViewerQueryDto,
} from './dto/rooker.dto';
import {
  RookerDeleteResultEntity,
  RookerFeedEntity,
  RookerFollowResultEntity,
  RookerNotificationListEntity,
  RookerPostEntity,
  RookerProfileEntity,
  RookerSearchEntity,
  RookerSuggestionListEntity,
  RookerThreadEntity,
  RookerTrendListEntity,
} from './entities/rooker.entity';

@ApiTags('SmartRotom | Rooker')
@Public()
@Controller('smartrotom/rooker')
export class RookerController {
  constructor(private readonly rookerService: RookerService) {}

  // ==================== FEED ====================

  @Get('feed')
  @ApiOperation({
    summary:
      'Timeline. parati = every non-reply trino (pinned first, then newest). ' +
      'siguiendo = trinos authored or retrinoed by the uuids the viewer follows.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: RookerFeedEntity })
  async getFeed(@Query() query: FeedQueryDto): Promise<RookerFeedEntity> {
    return this.rookerService.getFeed(
      query.tab ?? 'parati',
      query.uuid,
      query.limit ?? 20,
      query.offset ?? 0,
    ) as unknown as Promise<RookerFeedEntity>;
  }

  // ==================== DISCOVERY (before /posts/:id — literal paths first) ====

  @Get('trends')
  @ApiOperation({
    summary:
      'Derived trends: #tags on trinos from the last 7 days, by post count.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: RookerTrendListEntity })
  async getTrends(
    @Query() query: TrendsQueryDto,
  ): Promise<RookerTrendListEntity> {
    return this.rookerService.getTrends(query.limit ?? 10);
  }

  @Get('suggestions')
  @ApiOperation({
    summary: 'Who to follow — profiles the viewer does not follow yet.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: RookerSuggestionListEntity })
  async getSuggestions(
    @Query() query: SuggestionsQueryDto,
  ): Promise<RookerSuggestionListEntity> {
    return this.rookerService.getSuggestions(query.uuid, query.limit ?? 5);
  }

  @Get('search')
  @ApiOperation({
    summary: 'LIKE search over handles/display names, trino text and tags.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: RookerSearchEntity })
  async search(@Query() query: SearchQueryDto): Promise<RookerSearchEntity> {
    return this.rookerService.search(
      query.q,
      query.uuid,
    ) as unknown as Promise<RookerSearchEntity>;
  }

  @Get('notifications')
  @ApiOperation({
    summary: 'Rooker inbox — rotom_notifications filtered to type = "rooker".',
  })
  @ApiResponse({ status: HttpStatus.OK, type: RookerNotificationListEntity })
  async getNotifications(
    @Query() query: InboxQueryDto,
  ): Promise<RookerNotificationListEntity> {
    return this.rookerService.getNotifications(
      query.uuid,
      query.limit ?? 20,
      query.offset ?? 0,
    ) as unknown as Promise<RookerNotificationListEntity>;
  }

  @Get('bookmarks')
  @ApiOperation({ summary: 'Trinos the user bookmarked, newest first.' })
  @ApiResponse({ status: HttpStatus.OK, type: RookerFeedEntity })
  async getBookmarks(
    @Query() query: BookmarksQueryDto,
  ): Promise<RookerFeedEntity> {
    return this.rookerService.getBookmarks(
      query.uuid,
      query.limit ?? 20,
      query.offset ?? 0,
    ) as unknown as Promise<RookerFeedEntity>;
  }

  // ==================== PROFILES ====================

  @Patch('profile')
  @ApiOperation({
    summary: 'Upsert your own profile. 409 if the handle is taken.',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: HttpStatus.OK, type: RookerProfileEntity })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Handle already taken',
  })
  async updateProfile(
    @Body() dto: UpdateProfileDto,
  ): Promise<RookerProfileEntity> {
    return this.rookerService.updateProfile(
      dto,
    ) as unknown as Promise<RookerProfileEntity>;
  }

  // Declared BEFORE `profile/:handle` would be reachable as `me`, but it lives on its
  // own path so ordering is not load-bearing. The client knows its uuid, never its
  // handle — the seeder may have suffixed it to dodge a collision — so it cannot
  // address its own profile through the handle route without asking first.
  @Get('me')
  @ApiOperation({
    summary: "The signed-in trainer's own profile, resolved by uuid.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: RookerProfileEntity,
    description: 'Null when the trainer has no Rooker profile yet.',
  })
  async getMe(@Query() query: MeQueryDto): Promise<RookerProfileEntity | null> {
    return this.rookerService.getMe(
      query.uuid,
    ) as unknown as Promise<RookerProfileEntity | null>;
  }

  @Get('profile/:handle')
  @ApiOperation({
    summary:
      'Profile + counts + real derived trainer stats (pokédex & battle log).',
  })
  @ApiParam({ name: 'handle', example: 'luisca' })
  @ApiResponse({ status: HttpStatus.OK, type: RookerProfileEntity })
  async getProfile(
    @Param('handle') handle: string,
    @Query() query: ProfileQueryDto,
  ): Promise<RookerProfileEntity> {
    return this.rookerService.getProfile(
      handle,
      query.viewer,
    ) as unknown as Promise<RookerProfileEntity>;
  }

  @Get('profile/:handle/posts')
  @ApiOperation({ summary: "A user's trinos, filtered by tab." })
  @ApiParam({ name: 'handle', example: 'luisca' })
  @ApiResponse({ status: HttpStatus.OK, type: RookerFeedEntity })
  async getProfilePosts(
    @Param('handle') handle: string,
    @Query() query: ProfilePostsQueryDto,
  ): Promise<RookerFeedEntity> {
    return this.rookerService.getProfilePosts(
      handle,
      query.tab ?? 'trinos',
      query.uuid,
      query.limit ?? 20,
      query.offset ?? 0,
    ) as unknown as Promise<RookerFeedEntity>;
  }

  @Post('follow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle follow. Notifies the target on follow.' })
  @ApiBody({ type: FollowDto })
  @ApiResponse({ status: HttpStatus.OK, type: RookerFollowResultEntity })
  async follow(@Body() dto: FollowDto): Promise<RookerFollowResultEntity> {
    return this.rookerService.follow(dto.uuid, dto.targetUuid);
  }

  // ==================== POSTS ====================

  @Post('posts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Create a trino. Parses #tags; notifies the parent author on a reply.',
  })
  @ApiBody({ type: CreatePostDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: RookerPostEntity })
  async createPost(@Body() dto: CreatePostDto): Promise<RookerPostEntity> {
    return this.rookerService.createPost(
      dto,
    ) as unknown as Promise<RookerPostEntity>;
  }

  @Get('posts/:id')
  @ApiOperation({ summary: 'A trino and its replies.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: RookerThreadEntity })
  async getThread(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ViewerQueryDto,
  ): Promise<RookerThreadEntity> {
    return this.rookerService.getThread(
      id,
      query.uuid,
    ) as unknown as Promise<RookerThreadEntity>;
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Delete a trino. Author only — 403 otherwise.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: ActorDto })
  @ApiResponse({ status: HttpStatus.OK, type: RookerDeleteResultEntity })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not the author' })
  async deletePost(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActorDto,
  ): Promise<RookerDeleteResultEntity> {
    return this.rookerService.deletePost(id, dto.uuid);
  }

  @Post('posts/:id/react')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Set a reaction. A different type replaces the previous one; the same type toggles it off.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: ReactDto })
  @ApiResponse({
    status: HttpStatus.OK,
    type: RookerPostEntity,
    description: 'The post, re-hydrated for the actor.',
  })
  async react(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReactDto,
  ): Promise<RookerPostEntity> {
    return this.rookerService.react(
      id,
      dto.uuid,
      dto.type,
    ) as unknown as Promise<RookerPostEntity>;
  }

  @Post('posts/:id/retrino')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Toggle a retrino. Notifies the author when added.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: ActorDto })
  @ApiResponse({ status: HttpStatus.OK, type: RookerPostEntity })
  async retrino(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActorDto,
  ): Promise<RookerPostEntity> {
    return this.rookerService.retrino(
      id,
      dto.uuid,
    ) as unknown as Promise<RookerPostEntity>;
  }

  @Post('posts/:id/bookmark')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle a bookmark. Private — never notifies.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: ActorDto })
  @ApiResponse({ status: HttpStatus.OK, type: RookerPostEntity })
  async bookmark(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActorDto,
  ): Promise<RookerPostEntity> {
    return this.rookerService.bookmark(
      id,
      dto.uuid,
    ) as unknown as Promise<RookerPostEntity>;
  }
}
