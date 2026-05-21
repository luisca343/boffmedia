import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, or } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  BoffMediaUser,
  boffMediaUsers,
  boffMediaRoles,
  boffMediaUserRoles,
} from '@/_db/schema/BoffMedia';
import { smartrotomUsers } from '@/_db/schema/SmartRotom';
import { boffMediaParticipants } from '@/_db/schema/Events';
import {
  BoffMediaUserSafe,
  FullUserData,
  FullUserDataSafe,
  IBoffMediaUsersRepository,
} from './interfaces/users.repository.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
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
    googleId: boffMediaUsers.googleId,
    discordId: boffMediaUsers.discordId,
    twitchId: boffMediaUsers.twitchId,
    createdAt: boffMediaUsers.createdAt,
    updatedAt: boffMediaUsers.updatedAt,
  };

  private readonly userSelectWithPassword = {
    ...this.userSelectWithoutPassword,
    password: boffMediaUsers.password,
  };

  private readonly fullUserSelectWithoutPassword = {
    boffmedia_users: this.userSelectWithoutPassword,
    rotom_users: smartrotomUsers,
  };

  private readonly fullUserSelectWithPassword = {
    boffmedia_users: this.userSelectWithPassword,
    rotom_users: smartrotomUsers,
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
        .where(eq(boffMediaUsers.id, id))
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
        .where(eq(boffMediaUsers.username, username))
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
        .where(eq(boffMediaUsers.email, email))
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
        .where(eq(boffMediaUsers.uuid, uuid))
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
        .where(eq(boffMediaUsers.googleId, googleId))
        .execute();

      return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
      this.logger.error(`Failed to find user by Google ID ${googleId}:`, error);
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
          smartrotomUsers,
          eq(boffMediaUsers.uuid, smartrotomUsers.uuid),
        )
        .where(eq(boffMediaUsers.username, username))
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
          smartrotomUsers,
          eq(boffMediaUsers.uuid, smartrotomUsers.uuid),
        )
        .where(eq(boffMediaUsers.username, username))
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
          rotom_users: smartrotomUsers,
        })
        .from(smartrotomUsers)
        .leftJoin(boffMediaUsers, eq(boffMediaUsers.uuid, smartrotomUsers.uuid))
        .where(eq(smartrotomUsers.uuid, uuid))
        .execute();

      if (rows.length === 0) return null;

      return {
        boffmedia_users: rows[0].boffmedia_users as unknown as BoffMediaUserSafe,
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
          smartrotomUsers,
          eq(boffMediaUsers.uuid, smartrotomUsers.uuid),
        )
        .where(eq(boffMediaUsers.email, email))
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

      return data.map((d: { role: string | null }) => d.role ?? '').filter(Boolean);
    } catch (error: any) {
      this.logger.error(`Failed to get user roles for user ${userId}:`, error);
      throw new Error(`Failed to get user roles: ${error.message}`);
    }
  }

  // ==================== UPDATE OPERATIONS ====================

  async updateUser(
    id: number,
    updateData: UpdateUserDto,
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
      // Check if user exists
      const existingUser = await this.findUserById(id);
      if (!existingUser) {
        throw new Error(`User with ID ${id} not found`);
      }

      // Delete user
      await this.db
        .delete(boffMediaUsers)
        .where(eq(boffMediaUsers.id, id))
        .execute();

      return true;
    } catch (error: any) {
      this.logger.error(`Failed to delete user ${id}:`, error);
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
        .where(or(...conditions))
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
