import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, isNull, or } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  BoffMediaUser,
  boffMediaUsers,
  boffMediaRoles,
  boffMediaUserRoles,
} from '@/_db/schema/BoffMedia';
import { rotomUsers } from '@/_db/schema/SmartRotom';
import { boffMediaParticipants } from '@/_db/schema/BoffMediaEvents';
import {
  BoffMediaUserSafe,
  FullUserData,
  FullUserDataSafe,
  IBoffMediaUsersRepository,
} from './interfaces/users.repository.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { Logger } from 'nestjs-pino';

@Injectable()
export class BoffMediaUsersRepository implements IBoffMediaUsersRepository {
  constructor(
    private readonly logger: Logger,

    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== SELECT CLAUSES ====================

  private readonly userSelectWithoutPassword = {
    id: boffMediaUsers.id,
    email: boffMediaUsers.email,
    username: boffMediaUsers.username,
    uuid: boffMediaUsers.uuid,
    profilePicture: boffMediaUsers.profilePicture,
    coverImage: boffMediaUsers.coverImage,
    bio: boffMediaUsers.bio,
    googleId: boffMediaUsers.googleId,
    discordId: boffMediaUsers.discordId,
    twitchId: boffMediaUsers.twitchId,
    steamId: boffMediaUsers.steamId,
    emailVerified: boffMediaUsers.emailVerified,
    // Stored language preference — needed by MailService, which composes
    // transactional email server-side and cannot use the web's translations.
    locale: boffMediaUsers.locale,
    createdAt: boffMediaUsers.createdAt,
    updatedAt: boffMediaUsers.updatedAt,
  };

  private readonly userSelectWithPassword = {
    ...this.userSelectWithoutPassword,
    password: boffMediaUsers.password,
  };

  private readonly fullUserSelectWithoutPassword = {
    boffmedia_users: this.userSelectWithoutPassword,
    rotom_users: rotomUsers,
  };

  private readonly fullUserSelectWithPassword = {
    boffmedia_users: this.userSelectWithPassword,
    rotom_users: rotomUsers,
  };

  // ==================== CREATE OPERATIONS ====================

  async createUser(userData: CreateUserDto): Promise<BoffMediaUserSafe> {
    try {
      const result = await this.db
        .insert(boffMediaUsers)
        .values(userData as BoffMediaUser)
        .execute();

      const userId = result[0].insertId;
      const newUser = await this.findUserById(userId);

      if (!newUser) {
        throw new Error('Failed to retrieve created user');
      }

      return newUser;
    } catch (error: any) {
      this.logger.error('Failed to create user:', error);
      throw new Error(`User creation failed: ${error.message}`);
    }
  }

  async createParticipant(userId: number, username: string): Promise<void> {
    try {
      const existingParticipant = await this.db
        .select()
        .from(boffMediaParticipants)
        .where(eq(boffMediaParticipants.nickname, username))
        .execute();

      if (existingParticipant.length === 0) {
        await this.db
          .insert(boffMediaParticipants)
          .values({
            userId,
            nickname: username,
            avatar: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .execute();
      }
    } catch (error: any) {
      this.logger.error('Error creating participant:', error);
      throw new Error(`Participant creation failed: ${error.message}`);
    }
  }

  // ==================== READ OPERATIONS ====================

  async findAllUsers(): Promise<BoffMediaUserSafe[]> {
    try {
      return await this.db
        .select(this.userSelectWithoutPassword)
        .from(boffMediaUsers)
        .where(isNull(boffMediaUsers.deletedAt))
        .execute();
    } catch (error: any) {
      this.logger.error('Failed to retrieve all users:', error);
      throw new Error(`Failed to retrieve users: ${error.message}`);
    }
  }

  async findUserById(id: number): Promise<BoffMediaUserSafe | null> {
    if (!id || id <= 0) {
      throw new Error('Valid ID is required');
    }

    try {
      const rows = await this.db
        .select(this.userSelectWithoutPassword)
        .from(boffMediaUsers)
        .where(and(eq(boffMediaUsers.id, id), isNull(boffMediaUsers.deletedAt)))
        .execute();

      return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
      this.logger.error(`Failed to find user by ID ${id}:`, error);
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  async findUserByUsername(
    username: string,
  ): Promise<BoffMediaUserSafe | null> {
    if (!username || username.trim() === '') {
      throw new Error('Username is required');
    }

    try {
      const rows = await this.db
        .select(this.userSelectWithoutPassword)
        .from(boffMediaUsers)
        .where(
          and(
            eq(boffMediaUsers.username, username),
            isNull(boffMediaUsers.deletedAt),
          ),
        )
        .execute();

      return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
      this.logger.error(`Failed to find user by username ${username}:`, error);
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  async findUserByEmail(email: string): Promise<BoffMediaUserSafe | null> {
    if (!email || email.trim() === '') {
      throw new Error('Email is required');
    }

    try {
      const rows = await this.db
        .select(this.userSelectWithoutPassword)
        .from(boffMediaUsers)
        .where(
          and(
            eq(boffMediaUsers.email, email),
            isNull(boffMediaUsers.deletedAt),
          ),
        )
        .execute();

      return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
      this.logger.error(`Failed to find user by email ${email}:`, error);
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  async findUserByUuid(uuid: string): Promise<BoffMediaUserSafe | null> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('UUID is required');
    }

    try {
      const rows = await this.db
        .select(this.userSelectWithoutPassword)
        .from(boffMediaUsers)
        .where(
          and(eq(boffMediaUsers.uuid, uuid), isNull(boffMediaUsers.deletedAt)),
        )
        .execute();

      return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
      this.logger.error(`Failed to find user by UUID ${uuid}:`, error);
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  async findUserByGoogleId(
    googleId: string,
  ): Promise<BoffMediaUserSafe | null> {
    if (!googleId || googleId.trim() === '') {
      throw new Error('Google ID is required');
    }

    try {
      const rows = await this.db
        .select(this.userSelectWithoutPassword)
        .from(boffMediaUsers)
        .where(
          and(
            eq(boffMediaUsers.googleId, googleId),
            isNull(boffMediaUsers.deletedAt),
          ),
        )
        .execute();

      return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
      this.logger.error(`Failed to find user by Google ID ${googleId}:`, error);
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  async findUserByDiscordId(
    discordId: string,
  ): Promise<BoffMediaUserSafe | null> {
    if (!discordId || discordId.trim() === '') {
      throw new Error('Discord ID is required');
    }

    try {
      const rows = await this.db
        .select(this.userSelectWithoutPassword)
        .from(boffMediaUsers)
        .where(
          and(
            eq(boffMediaUsers.discordId, discordId),
            isNull(boffMediaUsers.deletedAt),
          ),
        )
        .execute();

      return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
      this.logger.error(
        `Failed to find user by Discord ID ${discordId}:`,
        error,
      );
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  async findUserBySteamId(steamId: string): Promise<BoffMediaUserSafe | null> {
    if (!steamId || steamId.trim() === '') {
      throw new Error('Steam ID is required');
    }

    try {
      const rows = await this.db
        .select(this.userSelectWithoutPassword)
        .from(boffMediaUsers)
        .where(
          and(
            eq(boffMediaUsers.steamId, steamId),
            isNull(boffMediaUsers.deletedAt),
          ),
        )
        .execute();

      return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
      this.logger.error(`Failed to find user by Steam ID ${steamId}:`, error);
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  async findUserByTwitchId(
    twitchId: string,
  ): Promise<BoffMediaUserSafe | null> {
    if (!twitchId || twitchId.trim() === '') {
      throw new Error('Twitch ID is required');
    }

    try {
      const rows = await this.db
        .select(this.userSelectWithoutPassword)
        .from(boffMediaUsers)
        .where(
          and(
            eq(boffMediaUsers.twitchId, twitchId),
            isNull(boffMediaUsers.deletedAt),
          ),
        )
        .execute();

      return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
      this.logger.error(`Failed to find user by Twitch ID ${twitchId}:`, error);
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  // ==================== COMPLEX QUERIES ====================

  async findFullUserByUsernameWithPassword(
    username: string,
  ): Promise<FullUserData | null> {
    if (!username || username.trim() === '') {
      throw new Error('Username is required');
    }

    try {
      const rows = await this.db
        .select(this.fullUserSelectWithPassword)
        .from(boffMediaUsers)
        .leftJoin(
          rotomUsers,
          eq(boffMediaUsers.uuid, rotomUsers.uuid),
        )
        .where(
          and(
            eq(boffMediaUsers.username, username),
            isNull(boffMediaUsers.deletedAt),
          ),
        )
        .execute();

      if (rows.length === 0) return null;

      return {
        boffmedia_users: rows[0].boffmedia_users,
        rotom_users: rows[0].rotom_users,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to find full user by username ${username}:`,
        error,
      );
      throw new Error(`Failed to find full user: ${error.message}`);
    }
  }

  async findFullUserByUsername(
    username: string,
  ): Promise<FullUserDataSafe | null> {
    if (!username || username.trim() === '') {
      throw new Error('Username is required');
    }

    try {
      const rows = await this.db
        .select(this.fullUserSelectWithoutPassword)
        .from(boffMediaUsers)
        .leftJoin(
          rotomUsers,
          eq(boffMediaUsers.uuid, rotomUsers.uuid),
        )
        .where(
          and(
            eq(boffMediaUsers.username, username),
            isNull(boffMediaUsers.deletedAt),
          ),
        )
        .execute();

      if (rows.length === 0) return null;

      return {
        boffmedia_users: rows[0].boffmedia_users,
        rotom_users: rows[0].rotom_users,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to find full user by username ${username}:`,
        error,
      );
      throw new Error(`Failed to find full user: ${error.message}`);
    }
  }

  async findFullUserByUuid(uuid: string): Promise<FullUserDataSafe | null> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('UUID is required');
    }

    try {
      const rows = await this.db
        .select({
          boffmedia_users: this.userSelectWithoutPassword,
          rotom_users: rotomUsers,
        })
        .from(rotomUsers)
        .leftJoin(boffMediaUsers, eq(boffMediaUsers.uuid, rotomUsers.uuid))
        .where(
          and(eq(rotomUsers.uuid, uuid), isNull(boffMediaUsers.deletedAt)),
        )
        .execute();

      if (rows.length === 0) return null;

      return {
        boffmedia_users: rows[0]
          .boffmedia_users as unknown as BoffMediaUserSafe,
        rotom_users: rows[0].rotom_users,
      };
    } catch (error: any) {
      this.logger.error(`Failed to find full user by UUID ${uuid}:`, error);
      throw new Error(`Failed to find full user: ${error.message}`);
    }
  }

  async findFullUserByEmail(email: string): Promise<FullUserDataSafe | null> {
    if (!email || email.trim() === '') {
      throw new Error('Email is required');
    }

    try {
      const rows = await this.db
        .select(this.fullUserSelectWithoutPassword)
        .from(boffMediaUsers)
        .leftJoin(
          rotomUsers,
          eq(boffMediaUsers.uuid, rotomUsers.uuid),
        )
        .where(
          and(
            eq(boffMediaUsers.email, email),
            isNull(boffMediaUsers.deletedAt),
          ),
        )
        .execute();

      if (rows.length === 0) return null;

      return {
        boffmedia_users: rows[0].boffmedia_users,
        rotom_users: rows[0].rotom_users,
      };
    } catch (error: any) {
      this.logger.error(`Failed to find full user by email ${email}:`, error);
      throw new Error(`Failed to find full user: ${error.message}`);
    }
  }

  async getUserRoles(userId: number): Promise<string[]> {
    if (!userId || userId <= 0) {
      throw new Error('Valid user ID is required');
    }

    try {
      const data = await this.db
        .select({ role: boffMediaRoles.name })
        .from(boffMediaUserRoles)
        .leftJoin(
          boffMediaRoles,
          eq(boffMediaRoles.id, boffMediaUserRoles.roleId),
        )
        .where(eq(boffMediaUserRoles.userId, userId))
        .execute();

      return data
        .map((d: { role: string | null }) => d.role ?? '')
        .filter(Boolean);
    } catch (error: any) {
      this.logger.error(`Failed to get user roles for user ${userId}:`, error);
      throw new Error(`Failed to get user roles: ${error.message}`);
    }
  }

  // ==================== UPDATE OPERATIONS ====================

  async updateUser(
    id: number,
    updateData: Partial<BoffMediaUser>,
  ): Promise<BoffMediaUserSafe> {
    if (!id || id <= 0) {
      throw new Error('Valid ID is required');
    }

    try {
      // Check if user exists
      const existingUser = await this.findUserById(id);
      if (!existingUser) {
        throw new Error(`User with ID ${id} not found`);
      }

      // Update user
      await this.db
        .update(boffMediaUsers)
        .set(updateData)
        .where(eq(boffMediaUsers.id, id))
        .execute();

      // Return updated user
      const updatedUser = await this.findUserById(id);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      return updatedUser;
    } catch (error: any) {
      this.logger.error(`Failed to update user ${id}:`, error);
      throw new Error(`User update failed: ${error.message}`);
    }
  }

  // ==================== DELETE OPERATIONS ====================

  async deleteUser(id: number): Promise<boolean> {
    if (!id || id <= 0) {
      throw new Error('Valid ID is required');
    }

    try {
      // findUserById already excludes soft-deleted rows, so a repeat delete
      // reports "not found".
      const existingUser = await this.findUserById(id);
      if (!existingUser) {
        throw new Error(`User with ID ${id} not found`);
      }

      const tombstone = `deleted_user_${id}`;

      // GDPR soft-delete: keep the row so foreign keys / leaderboards / history
      // survive, but scrub every PII field and stamp deletedAt. Reads and login
      // exclude deletedAt rows.
      await this.db
        .update(boffMediaUsers)
        .set({
          deletedAt: new Date(),
          username: tombstone,
          email: `deleted+${id}@deleted.invalid`,
          password: null,
          uuid: null,
          googleId: null,
          discordId: null,
          twitchId: null,
          steamId: null,
          profilePicture: 'https://cdn.boffmedia.es/default-profile.png',
          coverImage: null,
          bio: null,
        })
        .where(eq(boffMediaUsers.id, id))
        .execute();

      // Anonymize the public-facing participant identity (shown on leaderboards).
      await this.db
        .update(boffMediaParticipants)
        .set({ nickname: tombstone, avatar: null })
        .where(eq(boffMediaParticipants.userId, id))
        .execute();

      return true;
    } catch (error: any) {
      this.logger.error(`Failed to soft-delete user ${id}:`, error);
      throw new Error(`User deletion failed: ${error.message}`);
    }
  }

  // ==================== VALIDATION OPERATIONS ====================

  async checkUserExists(
    identifier: string,
    type: 'id' | 'username' | 'email' | 'uuid',
  ): Promise<boolean> {
    try {
      let user: BoffMediaUserSafe | null = null;

      switch (type) {
        case 'id':
          user = await this.findUserById(parseInt(identifier));
          break;
        case 'username':
          user = await this.findUserByUsername(identifier);
          break;
        case 'email':
          user = await this.findUserByEmail(identifier);
          break;
        case 'uuid':
          user = await this.findUserByUuid(identifier);
          break;
      }

      return !!user;
    } catch (error: any) {
      this.logger.error(`Failed to check if user exists ${identifier}:`, error);
      return false;
    }
  }

  async checkMultipleFieldsExist(fields: {
    username?: string;
    email?: string;
    uuid?: string;
  }): Promise<BoffMediaUserSafe[]> {
    try {
      const conditions = [];

      if (fields.username) {
        conditions.push(eq(boffMediaUsers.username, fields.username));
      }
      if (fields.email) {
        conditions.push(eq(boffMediaUsers.email, fields.email));
      }
      if (fields.uuid) {
        conditions.push(eq(boffMediaUsers.uuid, fields.uuid));
      }

      if (conditions.length === 0) {
        return [];
      }

      return await this.db
        .select(this.userSelectWithoutPassword)
        .from(boffMediaUsers)
        .where(and(or(...conditions), isNull(boffMediaUsers.deletedAt)))
        .execute();
    } catch (error: any) {
      this.logger.error('Failed to check multiple fields exist:', error);
      throw new Error(`Failed to check user existence: ${error.message}`);
    }
  }

  // ==================== STATISTICS ====================

  async getUserCount(): Promise<number> {
    try {
      const users = await this.findAllUsers();
      return users.length;
    } catch (error: any) {
      this.logger.error('Failed to get user count:', error);
      return 0;
    }
  }
}
