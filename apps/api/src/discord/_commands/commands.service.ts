import {
  DiscordUser,
  DiscordQuote,
  discordUsers,
  discordQuotes,
} from '@/_db/schema/Discord';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { Injectable } from '@nestjs/common';
import { User } from 'discord.js';
import { and, eq, sql, desc } from 'drizzle-orm';
import { getVoiceName } from '../_util/audio';
import { Logger } from 'nestjs-pino';

@Injectable()
export class CommandsService {
  constructor(
    private readonly logger: Logger,
    private db: MySQL2Service,
  ) {}
  private testServerGUID = '516237304101339156';

  async getFrases(
    guildID: string,
    userID?: string | { id: string },
    page = 1,
    maxQuotes = 10,
  ) {
    this.logger.log(
      `Fetching quotes for guild: ${guildID}, user: ${userID}, page: ${page}`,
    );
    let condition;
    if (guildID !== this.testServerGUID) {
      condition = eq(discordQuotes.serverId, guildID);
    }

    const finalCondition = userID
      ? and(
          condition,
          eq(
            discordQuotes.discordId,
            typeof userID === 'string' ? userID : userID.id,
          ),
        )
      : condition;

    this.logger.log('Final condition for fetching quotes:');
    this.logger.log(finalCondition);

    // Count the total number of quotes
    const totalCountQuery = await this.db
      .getDrizzle()
      .select({
        count: sql`COUNT(*)`,
      })
      .from(discordQuotes)
      .where(finalCondition);

    this.logger.log(`Total quotes found: ${totalCountQuery[0].count}`);
    const totalCount = totalCountQuery[0].count as number;
    const totalPages = Math.ceil(totalCount / maxQuotes);

    // Fetch the quotes with pagination
    const query = await this.db
      .getDrizzle()
      .select({
        id: discordQuotes.id,
        quote: discordQuotes.quote,
        comment: discordQuotes.comment,
        discordId: discordUsers.userId,
        discordName: discordUsers.username,
        serverId: discordQuotes.serverId,
        color: discordUsers.color,
        createdAt: discordQuotes.createdAt,
        avatar: discordUsers.avatar,
      })
      .from(discordQuotes)
      .leftJoin(discordUsers, eq(discordQuotes.discordId, discordUsers.userId))
      .where(finalCondition)
      // LIMIT/OFFSET without ORDER BY lets MySQL return the same row on two
      // pages (or skip one): paging was non-deterministic. `id` is the tiebreak.
      .orderBy(desc(discordQuotes.createdAt), desc(discordQuotes.id))
      .limit(maxQuotes)
      .offset((page - 1) * maxQuotes);

    return {
      frases: query,
      totalPages: totalPages,
    };
  }

  async addQuote(guildID: string, user: User, quote: string, comment?: string) {
    // Check if user exists
    const userExists = await this.db
      .getDrizzle()
      .select()
      .from(discordUsers)
      .where(eq(discordUsers.userId, user.id))
      .limit(1);

    this.logger.log(`User exists: ${userExists.length > 0}`);

    if (userExists.length === 0) {
      await this.db
        .getDrizzle()
        .insert(discordUsers)
        .values({
          userId: user.id,
          username: user.globalName,
          avatar: user.avatar,
          color: user.hexAccentColor,
        } as DiscordUser);
    }

    // Insert quote
    const quoteInsert = await this.db
      .getDrizzle()
      .insert(discordQuotes)
      .values({
        discordId: user.id,
        serverId: guildID,
        quote: quote,
        comment: comment,
      } as DiscordQuote);

    this.logger.log(`Quote inserted: ${quoteInsert}`);

    return {
      content: `Frase añadida correctamente "${quote}" - ${user.globalName}`,
      ephemeral: false,
    };
  }

  async getQuote(
    guildID: string,
    userId: string,
    quoteNum: number = 0,
    global = false,
  ) {
    if (quoteNum === 0) {
      this.logger.log('Getting random quote');
      // Get a random quote
      const queryBuilder = this.db
        .getDrizzle()
        .select({
          id: discordQuotes.id,
          quote: discordQuotes.quote,
          comment: discordQuotes.comment,
          discordId: discordUsers.userId,
          discordName: discordUsers.username,
          serverId: discordQuotes.serverId,
          color: discordUsers.color,
          createdAt: discordQuotes.createdAt,
          avatar: discordUsers.avatar,
        })
        .from(discordQuotes)
        .leftJoin(
          discordUsers,
          eq(discordQuotes.discordId, discordUsers.userId),
        );

      if (userId && global) {
        queryBuilder.where(eq(discordQuotes.discordId, userId));
      } else if (userId && !global) {
        queryBuilder.where(
          and(
            eq(discordQuotes.serverId, guildID),
            eq(discordQuotes.discordId, userId),
          ),
        );
      } else {
        queryBuilder.where(eq(discordQuotes.serverId, guildID));
      }

      const query = await queryBuilder.orderBy(sql`RAND()`).limit(1);

      return query[0];
    }
    const queryBuilder = this.db
      .getDrizzle()
      .select({
        id: discordQuotes.id,
        quote: discordQuotes.quote,
        comment: discordQuotes.comment,
        discordId: discordUsers.userId,
        discordName: discordUsers.username,
        serverId: discordQuotes.serverId,
        color: discordUsers.color,
        createdAt: discordQuotes.createdAt,
        avatar: discordUsers.avatar,
      })
      .from(discordQuotes)
      .leftJoin(discordUsers, eq(discordQuotes.discordId, discordUsers.userId));

    if (userId && global) {
      queryBuilder.where(eq(discordQuotes.discordId, userId));
    } else if (userId && !global) {
      queryBuilder.where(
        and(
          eq(discordQuotes.serverId, guildID),
          eq(discordQuotes.discordId, userId),
        ),
      );
    } else {
      queryBuilder.where(eq(discordQuotes.serverId, guildID));
    }

    const query = await queryBuilder.offset(quoteNum - 1).limit(1);

    return query[0];
  }

  async getTTSVoice(userId: string) {
    const data = await this.db
      .getDrizzle()
      .select({ voice: discordUsers.ttsVoice })
      .from(discordUsers)
      .where(eq(discordUsers.userId, userId))
      .limit(1);

    if (data.length === 0) {
      return 'Enrique';
    }

    return data[0].voice;
  }

  async setTTSVoice(userId: string, voice: number) {
    const voiceName = await getVoiceName(voice);
    await this.db
      .getDrizzle()
      .update(discordUsers)
      .set({ ttsVoice: voiceName } as DiscordUser)
      .where(eq(discordUsers.userId, userId));
  }
}
