import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import {
  and,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  like,
  ne,
  notInArray,
  or,
  sql,
} from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { smartRotomReplays, smartrotomUsers } from '@/_db/schema/SmartRotom';
import { pokedexRegistry } from '@/_db/schema/SmartRotomPokedex';
import { srNotifications } from '@/_db/schema/SmartRotom';
import {
  rookerBookmarks,
  rookerFollows,
  rookerHashtags,
  rookerPosts,
  rookerProfiles,
  rookerReactions,
  rookerRetrinos,
  NewRookerPost,
  RookerProfile,
} from '@/_db/schema/SmartRotomRooker';
import {
  emptyReactionCounts,
  FeedRow,
  PostAuthor,
  PostView,
  ProfileCounts,
  ReactionCounts,
  RookerPostType,
  RookerReactionType,
  SuggestionItem,
  TrainerStats,
  TrendItem,
} from './types/rooker.types';

const TRENDS_WINDOW_DAYS = 7;

@Injectable()
export class RookerRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== POSTS ====================

  async findPost(id: number) {
    const rows = await this.db
      .select()
      .from(rookerPosts)
      .where(eq(rookerPosts.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async createPost(data: NewRookerPost): Promise<number> {
    const [res] = await this.db.insert(rookerPosts).values(data).$returningId();
    return res.id;
  }

  async deletePost(id: number): Promise<void> {
    await this.db.delete(rookerPosts).where(eq(rookerPosts.id, id));
  }

  async insertHashtags(postId: number, tags: string[]): Promise<void> {
    if (tags.length === 0) return;
    await this.db
      .insert(rookerHashtags)
      .values(tags.map((tag) => ({ postId, tag })))
      .onDuplicateKeyUpdate({ set: { tag: sql`tag` } });
  }

  // ==================== FEEDS ====================
  // Feeds resolve to a list of FeedRow (post id + the timestamp it surfaced at),
  // which then goes through one batched hydration pass.

  async feedParati(limit: number, offset: number): Promise<FeedRow[]> {
    const rows = await this.db
      .select({
        postId: rookerPosts.id,
        createdAt: rookerPosts.createdAt,
        pinned: rookerPosts.pinned,
      })
      .from(rookerPosts)
      .where(isNull(rookerPosts.parentId))
      .orderBy(desc(rookerPosts.pinned), desc(rookerPosts.createdAt))
      .limit(limit)
      .offset(offset);

    return rows.map((r) => ({
      postId: r.postId,
      surfacedAt: r.createdAt ?? new Date(0),
      retrinoByUuid: null,
    }));
  }

  async countParati(): Promise<number> {
    const [r] = await this.db
      .select({ c: sql<number>`count(*)` })
      .from(rookerPosts)
      .where(isNull(rookerPosts.parentId));
    return Number(r?.c ?? 0);
  }

  async findFollowees(uuid: string): Promise<string[]> {
    const rows = await this.db
      .select({ uuid: rookerFollows.followeeUuid })
      .from(rookerFollows)
      .where(eq(rookerFollows.followerUuid, uuid));
    return rows.map((r) => r.uuid);
  }

  // "siguiendo" surfaces two things: posts authored by a followee, and posts a
  // followee retrinoed. Both are pulled with a window big enough to cover the
  // page, merged, deduped and sliced by the service.
  async feedSiguiendoCandidates(
    followees: string[],
    window: number,
  ): Promise<FeedRow[]> {
    if (followees.length === 0) return [];

    const [authored, retrinoed] = await Promise.all([
      this.db
        .select({ postId: rookerPosts.id, createdAt: rookerPosts.createdAt })
        .from(rookerPosts)
        .where(
          and(
            inArray(rookerPosts.uuid, followees),
            isNull(rookerPosts.parentId),
          ),
        )
        .orderBy(desc(rookerPosts.createdAt))
        .limit(window),

      this.db
        .select({
          postId: rookerRetrinos.postId,
          createdAt: rookerRetrinos.createdAt,
          retrinoByUuid: rookerRetrinos.uuid,
        })
        .from(rookerRetrinos)
        .where(inArray(rookerRetrinos.uuid, followees))
        .orderBy(desc(rookerRetrinos.createdAt))
        .limit(window),
    ]);

    return [
      ...authored.map((r) => ({
        postId: r.postId,
        surfacedAt: r.createdAt ?? new Date(0),
        retrinoByUuid: null as string | null,
      })),
      ...retrinoed.map((r) => ({
        postId: r.postId,
        surfacedAt: r.createdAt ?? new Date(0),
        retrinoByUuid: r.retrinoByUuid,
      })),
    ];
  }

  async findReplyIds(parentId: number, limit = 100): Promise<FeedRow[]> {
    const rows = await this.db
      .select({ postId: rookerPosts.id, createdAt: rookerPosts.createdAt })
      .from(rookerPosts)
      .where(eq(rookerPosts.parentId, parentId))
      .orderBy(rookerPosts.createdAt)
      .limit(limit);
    return rows.map((r) => ({
      postId: r.postId,
      surfacedAt: r.createdAt ?? new Date(0),
      retrinoByUuid: null,
    }));
  }

  async findPostIdsByAuthor(
    uuid: string,
    types: RookerPostType[] | null,
    mediaOnly: boolean,
    limit: number,
    offset: number,
  ): Promise<FeedRow[]> {
    const conditions = [eq(rookerPosts.uuid, uuid), isNull(rookerPosts.parentId)];
    if (types && types.length > 0) {
      conditions.push(inArray(rookerPosts.type, types));
    }
    if (mediaOnly) {
      conditions.push(sql`${rookerPosts.mediaUrl} IS NOT NULL`);
    }

    const rows = await this.db
      .select({ postId: rookerPosts.id, createdAt: rookerPosts.createdAt })
      .from(rookerPosts)
      .where(and(...conditions))
      .orderBy(desc(rookerPosts.pinned), desc(rookerPosts.createdAt))
      .limit(limit)
      .offset(offset);

    return rows.map((r) => ({
      postId: r.postId,
      surfacedAt: r.createdAt ?? new Date(0),
      retrinoByUuid: null,
    }));
  }

  async findBookmarkedPostIds(
    uuid: string,
    limit: number,
    offset: number,
  ): Promise<FeedRow[]> {
    const rows = await this.db
      .select({
        postId: rookerBookmarks.postId,
        createdAt: rookerBookmarks.createdAt,
      })
      .from(rookerBookmarks)
      .where(eq(rookerBookmarks.uuid, uuid))
      .orderBy(desc(rookerBookmarks.createdAt))
      .limit(limit)
      .offset(offset);

    return rows.map((r) => ({
      postId: r.postId,
      surfacedAt: r.createdAt ?? new Date(0),
      retrinoByUuid: null,
    }));
  }

  // ==================== HYDRATION ====================
  // ONE batched pass: 9 queries total regardless of how many posts are in the page.

  async hydrate(rows: FeedRow[], viewer?: string): Promise<PostView[]> {
    if (rows.length === 0) return [];

    const ids = [...new Set(rows.map((r) => r.postId))];

    const posts = await this.db
      .select()
      .from(rookerPosts)
      .where(inArray(rookerPosts.id, ids));

    if (posts.length === 0) return [];

    const authorUuids = [...new Set(posts.map((p) => p.uuid))];
    const captureIds = posts
      .map((p) => p.captureId)
      .filter((v): v is number => v !== null);
    const replayIds = posts
      .map((p) => p.replayId)
      .filter((v): v is number => v !== null);
    const retrinoerUuids = [
      ...new Set(
        rows.map((r) => r.retrinoByUuid).filter((v): v is string => v !== null),
      ),
    ];

    const [
      authors,
      replyCounts,
      retrinoCounts,
      reactionCounts,
      myReactions,
      myRetrinos,
      myBookmarks,
      captures,
      battles,
      retrinoers,
    ] = await Promise.all([
      this.db
        .select({
          uuid: smartrotomUsers.uuid,
          username: smartrotomUsers.username,
          handle: rookerProfiles.handle,
          displayName: rookerProfiles.displayName,
          partnerPokemonId: rookerProfiles.partnerPokemonId,
        })
        .from(smartrotomUsers)
        .leftJoin(rookerProfiles, eq(rookerProfiles.uuid, smartrotomUsers.uuid))
        .where(inArray(smartrotomUsers.uuid, authorUuids)),

      this.db
        .select({ parentId: rookerPosts.parentId, c: sql<number>`count(*)` })
        .from(rookerPosts)
        .where(inArray(rookerPosts.parentId, ids))
        .groupBy(rookerPosts.parentId),

      this.db
        .select({ postId: rookerRetrinos.postId, c: sql<number>`count(*)` })
        .from(rookerRetrinos)
        .where(inArray(rookerRetrinos.postId, ids))
        .groupBy(rookerRetrinos.postId),

      this.db
        .select({
          postId: rookerReactions.postId,
          type: rookerReactions.type,
          c: sql<number>`count(*)`,
        })
        .from(rookerReactions)
        .where(inArray(rookerReactions.postId, ids))
        .groupBy(rookerReactions.postId, rookerReactions.type),

      viewer
        ? this.db
            .select({
              postId: rookerReactions.postId,
              type: rookerReactions.type,
            })
            .from(rookerReactions)
            .where(
              and(
                inArray(rookerReactions.postId, ids),
                eq(rookerReactions.uuid, viewer),
              ),
            )
        : Promise.resolve([] as { postId: number; type: string }[]),

      viewer
        ? this.db
            .select({ postId: rookerRetrinos.postId })
            .from(rookerRetrinos)
            .where(
              and(
                inArray(rookerRetrinos.postId, ids),
                eq(rookerRetrinos.uuid, viewer),
              ),
            )
        : Promise.resolve([] as { postId: number }[]),

      viewer
        ? this.db
            .select({ postId: rookerBookmarks.postId })
            .from(rookerBookmarks)
            .where(
              and(
                inArray(rookerBookmarks.postId, ids),
                eq(rookerBookmarks.uuid, viewer),
              ),
            )
        : Promise.resolve([] as { postId: number }[]),

      captureIds.length > 0
        ? this.db
            .select()
            .from(pokedexRegistry)
            .where(inArray(pokedexRegistry.id, captureIds))
        : Promise.resolve([]),

      replayIds.length > 0
        ? this.db
            .select({
              id: smartRotomReplays.id,
              side1: smartRotomReplays.side1,
              side2: smartRotomReplays.side2,
              winner: smartRotomReplays.winner,
              createdAt: smartRotomReplays.createdAt,
            })
            .from(smartRotomReplays)
            .where(inArray(smartRotomReplays.id, replayIds))
        : Promise.resolve([]),

      retrinoerUuids.length > 0
        ? this.db
            .select({
              uuid: rookerProfiles.uuid,
              handle: rookerProfiles.handle,
            })
            .from(rookerProfiles)
            .where(inArray(rookerProfiles.uuid, retrinoerUuids))
        : Promise.resolve([]),
    ]);

    const authorMap = new Map<string, PostAuthor>(
      authors.map((a) => [
        a.uuid,
        {
          uuid: a.uuid,
          username: a.username,
          handle: a.handle ?? null,
          displayName: a.displayName ?? null,
          partnerPokemonId: a.partnerPokemonId ?? null,
          isVerified: false,
        },
      ]),
    );

    const replyMap = new Map<number, number>(
      replyCounts
        .filter((r) => r.parentId !== null)
        .map((r) => [r.parentId as number, Number(r.c)]),
    );
    const retrinoMap = new Map<number, number>(
      retrinoCounts.map((r) => [r.postId, Number(r.c)]),
    );

    const reactionMap = new Map<number, ReactionCounts>();
    for (const r of reactionCounts) {
      const bucket = reactionMap.get(r.postId) ?? emptyReactionCounts();
      if (r.type in bucket) {
        bucket[r.type as RookerReactionType] = Number(r.c);
      }
      reactionMap.set(r.postId, bucket);
    }

    const myReactionMap = new Map<number, string>(
      myReactions.map((r) => [r.postId, r.type]),
    );
    const myRetrinoSet = new Set(myRetrinos.map((r) => r.postId));
    const myBookmarkSet = new Set(myBookmarks.map((r) => r.postId));

    const captureMap = new Map(captures.map((c) => [c.id, c]));
    const battleMap = new Map(battles.map((b) => [b.id, b]));
    const retrinoerMap = new Map(retrinoers.map((r) => [r.uuid, r.handle]));

    const postMap = new Map(posts.map((p) => [p.id, p]));

    // Emit in the order the feed produced, not the order the DB returned.
    const views: PostView[] = [];
    for (const row of rows) {
      const p = postMap.get(row.postId);
      if (!p) continue;

      const capture =
        p.captureId !== null ? captureMap.get(p.captureId) : undefined;
      const battle = p.replayId !== null ? battleMap.get(p.replayId) : undefined;

      views.push({
        id: p.id,
        author: authorMap.get(p.uuid) ?? {
          uuid: p.uuid,
          username: 'unknown',
          handle: null,
          displayName: null,
          partnerPokemonId: null,
          isVerified: false,
        },
        text: p.text ?? null,
        type: p.type as RookerPostType,
        createdAt: p.createdAt ?? null,
        pinned: (p.pinned ?? 0) === 1,
        parentId: p.parentId ?? null,
        counts: {
          replies: replyMap.get(p.id) ?? 0,
          retrinos: retrinoMap.get(p.id) ?? 0,
          reactions: reactionMap.get(p.id) ?? emptyReactionCounts(),
        },
        me: {
          reaction:
            (myReactionMap.get(p.id) as RookerReactionType | undefined) ?? null,
          retrino: myRetrinoSet.has(p.id),
          bookmark: myBookmarkSet.has(p.id),
        },
        capture: capture
          ? {
              pokemonId: capture.pokemonId,
              formId: capture.formId,
              paletteId: capture.paletteId,
              shiny: capture.paletteId !== 'none',
              caughtAt: capture.caughtAt ?? null,
            }
          : null,
        battle: battle
          ? {
              replayId: battle.id,
              side1: battle.side1,
              side2: battle.side2,
              winner: battle.winner ?? null,
              createdAt: battle.createdAt ?? null,
            }
          : null,
        mediaUrl: p.mediaUrl ?? null,
        retrinoBy: row.retrinoByUuid
          ? (retrinoerMap.get(row.retrinoByUuid) ?? null)
          : null,
      });
    }

    return views;
  }

  // ==================== REACTIONS / RETRINOS / BOOKMARKS ====================

  async findReaction(postId: number, uuid: string) {
    const rows = await this.db
      .select()
      .from(rookerReactions)
      .where(
        and(eq(rookerReactions.postId, postId), eq(rookerReactions.uuid, uuid)),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async upsertReaction(
    postId: number,
    uuid: string,
    type: RookerReactionType,
  ): Promise<void> {
    await this.db
      .insert(rookerReactions)
      .values({ postId, uuid, type })
      .onDuplicateKeyUpdate({ set: { type } });
  }

  async deleteReaction(postId: number, uuid: string): Promise<void> {
    await this.db
      .delete(rookerReactions)
      .where(
        and(eq(rookerReactions.postId, postId), eq(rookerReactions.uuid, uuid)),
      );
  }

  async findRetrino(postId: number, uuid: string) {
    const rows = await this.db
      .select()
      .from(rookerRetrinos)
      .where(
        and(eq(rookerRetrinos.postId, postId), eq(rookerRetrinos.uuid, uuid)),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async insertRetrino(postId: number, uuid: string): Promise<void> {
    await this.db
      .insert(rookerRetrinos)
      .values({ postId, uuid })
      .onDuplicateKeyUpdate({ set: { postId } });
  }

  async deleteRetrino(postId: number, uuid: string): Promise<void> {
    await this.db
      .delete(rookerRetrinos)
      .where(
        and(eq(rookerRetrinos.postId, postId), eq(rookerRetrinos.uuid, uuid)),
      );
  }

  async findBookmark(postId: number, uuid: string) {
    const rows = await this.db
      .select()
      .from(rookerBookmarks)
      .where(
        and(eq(rookerBookmarks.postId, postId), eq(rookerBookmarks.uuid, uuid)),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async insertBookmark(postId: number, uuid: string): Promise<void> {
    await this.db
      .insert(rookerBookmarks)
      .values({ postId, uuid })
      .onDuplicateKeyUpdate({ set: { postId } });
  }

  async deleteBookmark(postId: number, uuid: string): Promise<void> {
    await this.db
      .delete(rookerBookmarks)
      .where(
        and(eq(rookerBookmarks.postId, postId), eq(rookerBookmarks.uuid, uuid)),
      );
  }

  // ==================== FOLLOWS ====================

  async findFollow(followerUuid: string, followeeUuid: string) {
    const rows = await this.db
      .select()
      .from(rookerFollows)
      .where(
        and(
          eq(rookerFollows.followerUuid, followerUuid),
          eq(rookerFollows.followeeUuid, followeeUuid),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async insertFollow(
    followerUuid: string,
    followeeUuid: string,
  ): Promise<void> {
    await this.db
      .insert(rookerFollows)
      .values({ followerUuid, followeeUuid })
      .onDuplicateKeyUpdate({ set: { followerUuid } });
  }

  async deleteFollow(
    followerUuid: string,
    followeeUuid: string,
  ): Promise<void> {
    await this.db
      .delete(rookerFollows)
      .where(
        and(
          eq(rookerFollows.followerUuid, followerUuid),
          eq(rookerFollows.followeeUuid, followeeUuid),
        ),
      );
  }

  async countFollowers(uuid: string): Promise<number> {
    const [r] = await this.db
      .select({ c: sql<number>`count(*)` })
      .from(rookerFollows)
      .where(eq(rookerFollows.followeeUuid, uuid));
    return Number(r?.c ?? 0);
  }

  // ==================== PROFILES ====================

  async findProfileByHandle(handle: string) {
    const rows = await this.db
      .select({
        uuid: rookerProfiles.uuid,
        handle: rookerProfiles.handle,
        displayName: rookerProfiles.displayName,
        bio: rookerProfiles.bio,
        link: rookerProfiles.link,
        partnerPokemonId: rookerProfiles.partnerPokemonId,
        createdAt: rookerProfiles.createdAt,
        username: smartrotomUsers.username,
      })
      .from(rookerProfiles)
      .innerJoin(smartrotomUsers, eq(smartrotomUsers.uuid, rookerProfiles.uuid))
      .where(eq(rookerProfiles.handle, handle))
      .limit(1);
    return rows[0] ?? null;
  }

  async findProfileByUuid(uuid: string): Promise<RookerProfile | null> {
    const rows = await this.db
      .select()
      .from(rookerProfiles)
      .where(eq(rookerProfiles.uuid, uuid))
      .limit(1);
    return rows[0] ?? null;
  }

  async findHandleOwner(handle: string): Promise<string | null> {
    const rows = await this.db
      .select({ uuid: rookerProfiles.uuid })
      .from(rookerProfiles)
      .where(eq(rookerProfiles.handle, handle))
      .limit(1);
    return rows[0]?.uuid ?? null;
  }

  async upsertProfile(
    uuid: string,
    values: {
      handle: string;
      displayName?: string | null;
      bio?: string | null;
      link?: string | null;
      partnerPokemonId?: number | null;
    },
  ): Promise<void> {
    const set: Record<string, unknown> = {
      handle: values.handle,
      updatedAt: new Date(),
    };
    if (values.displayName !== undefined) set.displayName = values.displayName;
    if (values.bio !== undefined) set.bio = values.bio;
    if (values.link !== undefined) set.link = values.link;
    if (values.partnerPokemonId !== undefined) {
      set.partnerPokemonId = values.partnerPokemonId;
    }

    await this.db
      .insert(rookerProfiles)
      .values({
        uuid,
        handle: values.handle,
        displayName: values.displayName ?? null,
        bio: values.bio ?? null,
        link: values.link ?? null,
        partnerPokemonId: values.partnerPokemonId ?? null,
      })
      .onDuplicateKeyUpdate({ set });
  }

  async profileCounts(uuid: string): Promise<ProfileCounts> {
    const [posts, followers, following] = await Promise.all([
      this.db
        .select({ c: sql<number>`count(*)` })
        .from(rookerPosts)
        .where(and(eq(rookerPosts.uuid, uuid), isNull(rookerPosts.parentId))),
      this.db
        .select({ c: sql<number>`count(*)` })
        .from(rookerFollows)
        .where(eq(rookerFollows.followeeUuid, uuid)),
      this.db
        .select({ c: sql<number>`count(*)` })
        .from(rookerFollows)
        .where(eq(rookerFollows.followerUuid, uuid)),
    ]);

    return {
      posts: Number(posts[0]?.c ?? 0),
      followers: Number(followers[0]?.c ?? 0),
      following: Number(following[0]?.c ?? 0),
    };
  }

  // Real derived trainer stats — read straight off the pokédex and the battle log.
  // `totalSpecies` is injected by the service (it owns the pokémon data source).
  async trainerStats(uuid: string, totalSpecies: number): Promise<TrainerStats> {
    const [captures, shinies, battles, distinctSpecies] = await Promise.all([
      this.db
        .select({ c: sql<number>`count(*)` })
        .from(pokedexRegistry)
        .where(
          and(
            eq(pokedexRegistry.uuid, uuid),
            sql`${pokedexRegistry.caughtAt} IS NOT NULL`,
          ),
        ),
      this.db
        .select({ c: sql<number>`count(*)` })
        .from(pokedexRegistry)
        .where(
          and(
            eq(pokedexRegistry.uuid, uuid),
            sql`${pokedexRegistry.caughtAt} IS NOT NULL`,
            ne(pokedexRegistry.paletteId, 'none'),
          ),
        ),
      this.db
        .select({ c: sql<number>`count(*)` })
        .from(smartRotomReplays)
        .where(
          or(
            eq(smartRotomReplays.side1, uuid),
            eq(smartRotomReplays.side2, uuid),
          ),
        ),
      this.db
        .select({
          c: sql<number>`count(distinct ${pokedexRegistry.pokemonId})`,
        })
        .from(pokedexRegistry)
        .where(
          and(
            eq(pokedexRegistry.uuid, uuid),
            sql`${pokedexRegistry.caughtAt} IS NOT NULL`,
          ),
        ),
    ]);

    const caughtSpecies = Number(distinctSpecies[0]?.c ?? 0);
    const dexPct =
      totalSpecies > 0
        ? Math.round((caughtSpecies / totalSpecies) * 1000) / 10
        : 0;

    return {
      captures: Number(captures[0]?.c ?? 0),
      shinies: Number(shinies[0]?.c ?? 0),
      battles: Number(battles[0]?.c ?? 0),
      dexPct,
    };
  }

  // Species actually caught by this trainer — used to validate partnerPokemonId.
  async hasCaughtSpecies(uuid: string, pokemonId: number): Promise<boolean> {
    const rows = await this.db
      .select({ id: pokedexRegistry.id })
      .from(pokedexRegistry)
      .where(
        and(
          eq(pokedexRegistry.uuid, uuid),
          eq(pokedexRegistry.pokemonId, pokemonId),
          sql`${pokedexRegistry.caughtAt} IS NOT NULL`,
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  // ==================== TRENDS / SUGGESTIONS / SEARCH ====================

  async trends(limit: number): Promise<TrendItem[]> {
    const since = new Date(
      Date.now() - TRENDS_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );

    const rows = await this.db
      .select({
        tag: rookerHashtags.tag,
        c: sql<number>`count(distinct ${rookerHashtags.postId})`,
      })
      .from(rookerHashtags)
      .innerJoin(rookerPosts, eq(rookerPosts.id, rookerHashtags.postId))
      .where(gte(rookerPosts.createdAt, since))
      .groupBy(rookerHashtags.tag)
      .orderBy(desc(sql`count(distinct ${rookerHashtags.postId})`))
      .limit(limit);

    return rows.map((r) => ({ tag: r.tag, posts: Number(r.c) }));
  }

  async suggestions(
    viewer: string | undefined,
    limit: number,
  ): Promise<SuggestionItem[]> {
    const exclude: string[] = [];
    if (viewer) {
      exclude.push(viewer, ...(await this.findFollowees(viewer)));
    }

    const conditions = [];
    if (exclude.length > 0) {
      conditions.push(notInArray(rookerProfiles.uuid, exclude));
    }

    const rows = await this.db
      .select({
        uuid: rookerProfiles.uuid,
        handle: rookerProfiles.handle,
        displayName: rookerProfiles.displayName,
        partnerPokemonId: rookerProfiles.partnerPokemonId,
        username: smartrotomUsers.username,
        followers: sql<number>`count(${rookerFollows.followerUuid})`,
      })
      .from(rookerProfiles)
      .innerJoin(smartrotomUsers, eq(smartrotomUsers.uuid, rookerProfiles.uuid))
      .leftJoin(
        rookerFollows,
        eq(rookerFollows.followeeUuid, rookerProfiles.uuid),
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(
        rookerProfiles.uuid,
        rookerProfiles.handle,
        rookerProfiles.displayName,
        rookerProfiles.partnerPokemonId,
        smartrotomUsers.username,
      )
      .orderBy(desc(sql`count(${rookerFollows.followerUuid})`))
      .limit(limit);

    return rows.map((r) => ({
      uuid: r.uuid,
      username: r.username,
      handle: r.handle,
      displayName: r.displayName ?? null,
      partnerPokemonId: r.partnerPokemonId ?? null,
      followers: Number(r.followers),
    }));
  }

  async searchUsers(term: string, limit: number): Promise<SuggestionItem[]> {
    const rows = await this.db
      .select({
        uuid: rookerProfiles.uuid,
        handle: rookerProfiles.handle,
        displayName: rookerProfiles.displayName,
        partnerPokemonId: rookerProfiles.partnerPokemonId,
        username: smartrotomUsers.username,
        followers: sql<number>`count(${rookerFollows.followerUuid})`,
      })
      .from(rookerProfiles)
      .innerJoin(smartrotomUsers, eq(smartrotomUsers.uuid, rookerProfiles.uuid))
      .leftJoin(
        rookerFollows,
        eq(rookerFollows.followeeUuid, rookerProfiles.uuid),
      )
      .where(
        or(
          like(rookerProfiles.handle, `%${term}%`),
          like(rookerProfiles.displayName, `%${term}%`),
          like(smartrotomUsers.username, `%${term}%`),
        ),
      )
      .groupBy(
        rookerProfiles.uuid,
        rookerProfiles.handle,
        rookerProfiles.displayName,
        rookerProfiles.partnerPokemonId,
        smartrotomUsers.username,
      )
      .limit(limit);

    return rows.map((r) => ({
      uuid: r.uuid,
      username: r.username,
      handle: r.handle,
      displayName: r.displayName ?? null,
      partnerPokemonId: r.partnerPokemonId ?? null,
      followers: Number(r.followers),
    }));
  }

  async searchPostIds(term: string, limit: number): Promise<FeedRow[]> {
    const rows = await this.db
      .select({ postId: rookerPosts.id, createdAt: rookerPosts.createdAt })
      .from(rookerPosts)
      .where(like(rookerPosts.text, `%${term}%`))
      .orderBy(desc(rookerPosts.createdAt))
      .limit(limit);

    return rows.map((r) => ({
      postId: r.postId,
      surfacedAt: r.createdAt ?? new Date(0),
      retrinoByUuid: null,
    }));
  }

  async searchTags(term: string, limit: number): Promise<TrendItem[]> {
    const rows = await this.db
      .select({
        tag: rookerHashtags.tag,
        c: sql<number>`count(distinct ${rookerHashtags.postId})`,
      })
      .from(rookerHashtags)
      .where(like(rookerHashtags.tag, `%${term}%`))
      .groupBy(rookerHashtags.tag)
      .orderBy(desc(sql`count(distinct ${rookerHashtags.postId})`))
      .limit(limit);

    return rows.map((r) => ({ tag: r.tag, posts: Number(r.c) }));
  }

  // ==================== NOTIFICATIONS (read-side) ====================
  // Writes go through NotificationsService (it also emits the socket event);
  // this read is a plain filtered projection of the generic table.

  async rookerNotifications(uuid: string, limit: number, offset: number) {
    const [items, total] = await Promise.all([
      this.db
        .select()
        .from(srNotifications)
        .where(
          and(
            eq(srNotifications.userUuid, uuid),
            eq(srNotifications.type, 'rooker'),
          ),
        )
        .orderBy(desc(srNotifications.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ c: sql<number>`count(*)` })
        .from(srNotifications)
        .where(
          and(
            eq(srNotifications.userUuid, uuid),
            eq(srNotifications.type, 'rooker'),
          ),
        ),
    ]);

    return { items, total: Number(total[0]?.c ?? 0) };
  }
}
