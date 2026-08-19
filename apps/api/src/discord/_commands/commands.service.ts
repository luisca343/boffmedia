import {
  DiscordUser,
  FicusQuote,
  discordUsers,
  ficusQuotes,
} from '@/_db/schema/Ficus';
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
      condition = eq(ficusQuotes.serverId, guildID);
    }

    const finalCondition = userID
      ? and(
          condition,
          eq(
            ficusQuotes.discordId,
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
      .from(ficusQuotes)
      .where(finalCondition);

    this.logger.log(`Total quotes found: ${totalCountQuery[0].count}`);
    const totalCount = totalCountQuery[0].count as number;
    const totalPages = Math.ceil(totalCount / maxQuotes);

    // Fetch the quotes with pagination
    const query = await this.db
      .getDrizzle()
      .select({
        id: ficusQuotes.id,
        quote: ficusQuotes.quote,
        comment: ficusQuotes.comment,
        discordId: discordUsers.userId,
        discordName: discordUsers.username,
        serverId: ficusQuotes.serverId,
        color: discordUsers.color,
        createdAt: ficusQuotes.createdAt,
        avatar: discordUsers.avatar,
      })
      .from(ficusQuotes)
      .leftJoin(discordUsers, eq(ficusQuotes.discordId, discordUsers.userId))
      .where(finalCondition)
      // LIMIT/OFFSET without ORDER BY lets MySQL return the same row on two
      // pages (or skip one): paging was non-deterministic. `id` is the tiebreak.
      .orderBy(desc(ficusQuotes.createdAt), desc(ficusQuotes.id))
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
      .insert(ficusQuotes)
      .values({
        discordId: user.id,
        serverId: guildID,
        quote: quote,
        comment: comment,
      } as FicusQuote);

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
          id: ficusQuotes.id,
          quote: ficusQuotes.quote,
          comment: ficusQuotes.comment,
          discordId: discordUsers.userId,
          discordName: discordUsers.username,
          serverId: ficusQuotes.serverId,
          color: discordUsers.color,
          createdAt: ficusQuotes.createdAt,
          avatar: discordUsers.avatar,
        })
        .from(ficusQuotes)
        .leftJoin(discordUsers, eq(ficusQuotes.discordId, discordUsers.userId));

      if (userId && global) {
        queryBuilder.where(eq(ficusQuotes.discordId, userId));
      } else if (userId && !global) {
        queryBuilder.where(
          and(
            eq(ficusQuotes.serverId, guildID),
            eq(ficusQuotes.discordId, userId),
          ),
        );
      } else {
        queryBuilder.where(eq(ficusQuotes.serverId, guildID));
      }

      const query = await queryBuilder.orderBy(sql`RAND()`).limit(1);

      return query[0];
    }
    const queryBuilder = this.db
      .getDrizzle()
      .select({
        id: ficusQuotes.id,
        quote: ficusQuotes.quote,
        comment: ficusQuotes.comment,
        discordId: discordUsers.userId,
        discordName: discordUsers.username,
        serverId: ficusQuotes.serverId,
        color: discordUsers.color,
        createdAt: ficusQuotes.createdAt,
        avatar: discordUsers.avatar,
      })
      .from(ficusQuotes)
      .leftJoin(discordUsers, eq(ficusQuotes.discordId, discordUsers.userId));

    if (userId && global) {
      queryBuilder.where(eq(ficusQuotes.discordId, userId));
    } else if (userId && !global) {
      queryBuilder.where(
        and(
          eq(ficusQuotes.serverId, guildID),
          eq(ficusQuotes.discordId, userId),
        ),
      );
    } else {
      queryBuilder.where(eq(ficusQuotes.serverId, guildID));
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
