import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RookerRepository } from './rooker.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { PokemonDataManagementService } from '../pokemon/services/pokemon-data-management.service';
import {
  CreatePostDto,
  HANDLE_REGEX,
  UpdateProfileDto,
} from './dto/rooker.dto';
import {
  FeedRow,
  PostView,
  ProfileView,
  RookerPostType,
  RookerReactionType,
  SearchResult,
  SuggestionItem,
  TrendItem,
} from './types/rooker.types';
import { baseHandle, handleCandidates } from './handle';

// Every Rooker notification lands in the generic rotom_notifications table under
// this single type — the GET filter keys off it exactly.
const NOTIF_TYPE = 'rooker';

const MAX_HASHTAGS_PER_POST = 10;
const MAX_REPLIES = 100;

/**
 * How many handles ensureProfile() will try before giving up. Each one is a round trip,
 * and needing more than this means a genuinely pathological pile-up on one base name —
 * at which point failing and logging beats hammering the database.
 */
const MAX_HANDLE_ATTEMPTS = 25;

@Injectable()
export class RookerService {
  constructor(
    private readonly repo: RookerRepository,
    private readonly notifications: NotificationsService,
    private readonly pokemonData: PokemonDataManagementService,
  ) {}

  // ==================== FEEDS ====================

  async getFeed(
    tab: 'parati' | 'siguiendo',
    viewer: string | undefined,
    limit: number,
    offset: number,
  ): Promise<{ items: PostView[]; hasMore: boolean }> {
    let rows: FeedRow[];
    let hasMore: boolean;

    if (tab === 'siguiendo') {
      if (!viewer) {
        // "siguiendo" without a viewer has no meaning — an empty timeline, not an error.
        return { items: [], hasMore: false };
      }
      const followees = await this.repo.findFollowees(viewer);
      const window = offset + limit + 1;
      const candidates = await this.repo.feedSiguiendoCandidates(
        followees,
        window,
      );

      // A post can surface twice (authored by one followee, retrinoed by another).
      // Keep the most recent surfacing, preferring the original over the retrino.
      const best = new Map<number, FeedRow>();
      for (const c of candidates) {
        const prev = best.get(c.postId);
        if (!prev) {
          best.set(c.postId, c);
          continue;
        }
        const prevIsOriginal = prev.retrinoByUuid === null;
        const curIsOriginal = c.retrinoByUuid === null;
        if (curIsOriginal && !prevIsOriginal) best.set(c.postId, c);
        else if (
          curIsOriginal === prevIsOriginal &&
          c.surfacedAt > prev.surfacedAt
        ) {
          best.set(c.postId, c);
        }
      }

      const merged = [...best.values()].sort(
        (a, b) => b.surfacedAt.getTime() - a.surfacedAt.getTime(),
      );
      rows = merged.slice(offset, offset + limit);
      hasMore = merged.length > offset + limit;
    } else {
      rows = await this.repo.feedParati(limit + 1, offset);
      hasMore = rows.length > limit;
      rows = rows.slice(0, limit);
    }

    const items = await this.repo.hydrate(rows, viewer);
    return { items, hasMore };
  }

  async getThread(
    id: number,
    viewer?: string,
  ): Promise<{ post: PostView; replies: PostView[] }> {
    const post = await this.repo.findPost(id);
    if (!post) throw new NotFoundException(`Trino ${id} not found`);

    const replyRows = await this.repo.findReplyIds(id, MAX_REPLIES);

    const [postViews, replies] = await Promise.all([
      this.repo.hydrate(
        [
          {
            postId: id,
            surfacedAt: post.createdAt ?? new Date(0),
            retrinoByUuid: null,
          },
        ],
        viewer,
      ),
      this.repo.hydrate(replyRows, viewer),
    ]);

    return { post: postViews[0], replies };
  }

  // ==================== POSTS ====================

  async createPost(dto: CreatePostDto): Promise<PostView> {
    const type: RookerPostType = dto.type ?? 'text';

    if (!dto.text && !dto.mediaUrl && !dto.captureId && !dto.replayId) {
      throw new BadRequestException(
        'A trino needs at least one of: text, mediaUrl, captureId, replayId',
      );
    }

    let parent = null;
    if (dto.parentId !== undefined && dto.parentId !== null) {
      parent = await this.repo.findPost(dto.parentId);
      if (!parent) {
        throw new NotFoundException(`Parent trino ${dto.parentId} not found`);
      }
    }

    const id = await this.repo.createPost({
      uuid: dto.uuid,
      text: dto.text ?? null,
      type,
      parentId: dto.parentId ?? null,
      mediaUrl: dto.mediaUrl ?? null,
      captureId: dto.captureId ?? null,
      replayId: dto.replayId ?? null,
    });

    const tags = this.parseHashtags(dto.text);
    if (tags.length > 0) await this.repo.insertHashtags(id, tags);

    if (parent && parent.uuid !== dto.uuid) {
      await this.notify(
        parent.uuid,
        `${await this.mention(dto.uuid)} respondió tu trino`,
        this.excerpt(dto.text) ?? 'Ha respondido a tu trino.',
        `/smartrotom/rooker/trino/${id}`,
      );
    }

    const views = await this.repo.hydrate(
      [{ postId: id, surfacedAt: new Date(), retrinoByUuid: null }],
      dto.uuid,
    );
    return views[0];
  }

  async deletePost(
    id: number,
    uuid: string,
  ): Promise<{ ok: true; id: number }> {
    const post = await this.repo.findPost(id);
    if (!post) throw new NotFoundException(`Trino ${id} not found`);
    if (post.uuid !== uuid) {
      throw new ForbiddenException('Only the author can delete this trino');
    }
    await this.repo.deletePost(id);
    return { ok: true, id };
  }

  // ==================== INTERACTIONS ====================

  async react(
    id: number,
    uuid: string,
    type: RookerReactionType,
  ): Promise<PostView> {
    const post = await this.repo.findPost(id);
    if (!post) throw new NotFoundException(`Trino ${id} not found`);

    const existing = await this.repo.findReaction(id, uuid);

    if (existing && existing.type === type) {
      // Same reaction again → toggle OFF.
      await this.repo.deleteReaction(id, uuid);
    } else {
      // No reaction, or a different one → upsert (the composite PK replaces it).
      await this.repo.upsertReaction(id, uuid, type);
      if (post.uuid !== uuid) {
        await this.notify(
          post.uuid,
          `${await this.mention(uuid)} reaccionó a tu trino`,
          this.excerpt(post.text) ?? 'Ha reaccionado a tu trino.',
          `/smartrotom/rooker/trino/${id}`,
        );
      }
    }

    return this.reload(id, uuid);
  }

  async retrino(id: number, uuid: string): Promise<PostView> {
    const post = await this.repo.findPost(id);
    if (!post) throw new NotFoundException(`Trino ${id} not found`);

    const existing = await this.repo.findRetrino(id, uuid);
    if (existing) {
      await this.repo.deleteRetrino(id, uuid);
    } else {
      await this.repo.insertRetrino(id, uuid);
      if (post.uuid !== uuid) {
        await this.notify(
          post.uuid,
          `${await this.mention(uuid)} hizo retrino de tu trino`,
          this.excerpt(post.text) ?? 'Ha hecho retrino de tu trino.',
          `/smartrotom/rooker/trino/${id}`,
        );
      }
    }

    return this.reload(id, uuid);
  }

  async bookmark(id: number, uuid: string): Promise<PostView> {
    const post = await this.repo.findPost(id);
    if (!post) throw new NotFoundException(`Trino ${id} not found`);

    const existing = await this.repo.findBookmark(id, uuid);
    if (existing) await this.repo.deleteBookmark(id, uuid);
    else await this.repo.insertBookmark(id, uuid);

    // Bookmarks are private — never notify the author.
    return this.reload(id, uuid);
  }

  async follow(
    uuid: string,
    targetUuid: string,
  ): Promise<{ following: boolean; followers: number }> {
    if (uuid === targetUuid) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const existing = await this.repo.findFollow(uuid, targetUuid);
    let following: boolean;

    if (existing) {
      await this.repo.deleteFollow(uuid, targetUuid);
      following = false;
    } else {
      await this.repo.insertFollow(uuid, targetUuid);
      following = true;
      await this.notify(
        targetUuid,
        `${await this.mention(uuid)} te sigue`,
        'Tienes un nuevo seguidor en Rooker.',
        `/smartrotom/rooker/perfil/${(await this.repo.findProfileByUuid(uuid))?.handle ?? ''}`,
      );
    }

    const followers = await this.repo.countFollowers(targetUuid);
    return { following, followers };
  }

  // ==================== PROFILES ====================

  /**
   * The signed-in trainer's own profile, resolved from their uuid.
   *
   * Every other profile route is addressed by handle — that is the identity players
   * see and link to. But the client only ever knows its own *uuid* (that is what the
   * session carries), and it needs the handle to render its own nav chip and to link
   * to its own page. Deriving the handle client-side from the username is not safe:
   * the seeder deduplicates collisions with a numeric suffix, so the two can differ.
   */
  async getMe(uuid: string): Promise<ProfileView | null> {
    const profile = await this.repo.findProfileByUuid(uuid);
    if (!profile) return null;
    return this.getProfile(profile.handle, uuid);
  }

  /**
   * Give a player a profile if they do not have one, deriving the handle from their
   * username. Idempotent — an existing profile is returned untouched, never renamed.
   *
   * Called when a SmartRotom user is created, because a player without a profile is in a
   * dead end rather than merely incomplete: the composer is hidden, their profile page
   * 404s for everyone, and the only route to the "edit profile" form is their own profile
   * page — so they cannot create one themselves.
   *
   * Returns the handle, or null if every candidate it was willing to try was taken.
   */
  async ensureProfile(uuid: string, username: string): Promise<string | null> {
    const existing = await this.repo.findProfileByUuid(uuid);
    if (existing) return existing.handle;

    const base = baseHandle(username);
    let attempts = 0;

    for (const candidate of handleCandidates(base)) {
      if (++attempts > MAX_HANDLE_ATTEMPTS) break;

      // Cheap pre-check: skips a doomed insert for the common case of a handle that is
      // simply already taken. It is not the guarantee — the unique index below is.
      if (await this.repo.findHandleOwner(candidate)) continue;

      try {
        await this.repo.insertProfile(uuid, candidate, username);
        return candidate;
      } catch (error: any) {
        // Two players registering at once can both clear the pre-check and race for the
        // same handle. The loser takes the next candidate rather than failing.
        if (error?.code === 'ER_DUP_ENTRY') continue;
        throw error;
      }
    }

    return null;
  }

  async getProfile(handle: string, viewer?: string): Promise<ProfileView> {
    const profile = await this.repo.findProfileByHandle(handle);
    if (!profile) throw new NotFoundException(`Profile @${handle} not found`);

    const totalSpecies = this.pokemonData.countPokemon();

    const [counts, stats, follow] = await Promise.all([
      this.repo.profileCounts(profile.uuid),
      this.repo.trainerStats(profile.uuid, totalSpecies),
      viewer
        ? this.repo.findFollow(viewer, profile.uuid)
        : Promise.resolve(null),
    ]);

    return {
      uuid: profile.uuid,
      username: profile.username,
      handle: profile.handle,
      displayName: profile.displayName ?? null,
      bio: profile.bio ?? null,
      link: profile.link ?? null,
      partnerPokemonId: profile.partnerPokemonId ?? null,
      createdAt: profile.createdAt ?? null,
      counts,
      stats,
      isFollowedByMe: follow !== null,
    };
  }

  async updateProfile(dto: UpdateProfileDto): Promise<ProfileView> {
    const existing = await this.repo.findProfileByUuid(dto.uuid);

    const handle = dto.handle ?? existing?.handle;
    if (!handle) {
      throw new BadRequestException(
        'handle is required when creating a profile',
      );
    }
    if (!HANDLE_REGEX.test(handle)) {
      throw new BadRequestException('handle must match ^[a-z0-9_]{3,32}$');
    }

    const owner = await this.repo.findHandleOwner(handle);
    if (owner && owner !== dto.uuid) {
      throw new ConflictException(`Handle @${handle} is already taken`);
    }

    // The partner pokémon has to be one they actually caught.
    if (dto.partnerPokemonId !== undefined && dto.partnerPokemonId !== null) {
      const caught = await this.repo.hasCaughtSpecies(
        dto.uuid,
        dto.partnerPokemonId,
      );
      if (!caught) {
        throw new BadRequestException(
          `Pokémon ${dto.partnerPokemonId} is not in your pokédex as caught`,
        );
      }
    }

    await this.repo.upsertProfile(dto.uuid, {
      handle,
      displayName: dto.displayName,
      bio: dto.bio,
      link: dto.link,
      partnerPokemonId: dto.partnerPokemonId,
    });

    return this.getProfile(handle, dto.uuid);
  }

  async getProfilePosts(
    handle: string,
    tab: 'trinos' | 'capturas' | 'combates' | 'media',
    viewer: string | undefined,
    limit: number,
    offset: number,
  ): Promise<{ items: PostView[]; hasMore: boolean }> {
    const profile = await this.repo.findProfileByHandle(handle);
    if (!profile) throw new NotFoundException(`Profile @${handle} not found`);

    let types: RookerPostType[] | null = null;
    let mediaOnly = false;

    if (tab === 'capturas') types = ['capture'];
    else if (tab === 'combates') types = ['battle'];
    else if (tab === 'media') mediaOnly = true;
    // 'trinos' → everything the user posted, unfiltered.

    const rows = await this.repo.findPostIdsByAuthor(
      profile.uuid,
      types,
      mediaOnly,
      limit + 1,
      offset,
    );
    const hasMore = rows.length > limit;
    const items = await this.repo.hydrate(rows.slice(0, limit), viewer);
    return { items, hasMore };
  }

  // ==================== DISCOVERY ====================

  async getTrends(limit: number): Promise<{ items: TrendItem[] }> {
    return { items: await this.repo.trends(limit) };
  }

  async getSuggestions(
    viewer: string | undefined,
    limit: number,
  ): Promise<{ items: SuggestionItem[] }> {
    return { items: await this.repo.suggestions(viewer, limit) };
  }

  async search(term: string, viewer?: string): Promise<SearchResult> {
    const clean = term.replace(/^#/, '').trim();
    if (clean.length === 0) return { users: [], posts: [], tags: [] };

    const [users, postRows, tags] = await Promise.all([
      this.repo.searchUsers(clean, 10),
      this.repo.searchPostIds(clean, 20),
      this.repo.searchTags(clean.toLowerCase(), 10),
    ]);

    const posts = await this.repo.hydrate(postRows, viewer);
    return { users, posts, tags };
  }

  // ==================== NOTIFICATIONS / BOOKMARKS ====================

  async getNotifications(uuid: string, limit: number, offset: number) {
    return this.repo.rookerNotifications(uuid, limit, offset);
  }

  async getBookmarks(
    uuid: string,
    limit: number,
    offset: number,
  ): Promise<{ items: PostView[]; hasMore: boolean }> {
    const rows = await this.repo.findBookmarkedPostIds(uuid, limit + 1, offset);
    const hasMore = rows.length > limit;
    const items = await this.repo.hydrate(rows.slice(0, limit), uuid);
    return { items, hasMore };
  }

  // ==================== HELPERS ====================

  // #tags are parsed out of the text on create; the hashtags table is a derived
  // index, never an input. Lowercased so trends group case-insensitively.
  private parseHashtags(text?: string | null): string[] {
    if (!text) return [];
    const matches = text.matchAll(/#([\p{L}\p{N}_]{1,64})/gu);
    const tags = new Set<string>();
    for (const m of matches) {
      tags.add(m[1].toLowerCase().slice(0, 64));
      if (tags.size >= MAX_HASHTAGS_PER_POST) break;
    }
    return [...tags];
  }

  private excerpt(text?: string | null): string | null {
    if (!text) return null;
    return text.length > 120 ? `${text.slice(0, 117)}…` : text;
  }

  private async mention(uuid: string): Promise<string> {
    const profile = await this.repo.findProfileByUuid(uuid);
    return profile ? `@${profile.handle}` : 'Alguien';
  }

  private async notify(
    userUuid: string,
    title: string,
    body: string,
    link: string,
  ): Promise<void> {
    await this.notifications.createNotification({
      userUuid,
      type: NOTIF_TYPE,
      title,
      body,
      link,
    });
  }

  private async reload(id: number, viewer: string): Promise<PostView> {
    const views = await this.repo.hydrate(
      [{ postId: id, surfacedAt: new Date(), retrinoByUuid: null }],
      viewer,
    );
    return views[0];
  }
}
