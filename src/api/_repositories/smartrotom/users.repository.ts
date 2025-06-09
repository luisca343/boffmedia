import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { SmartRotomUser, smartrotomUsers } from '@/_db/schema/SmartRotom';
import { eq } from 'drizzle-orm';

export interface CreateUserData {
  uuid: string;
  username: string;
  world?: string;
}

export interface UpdateUserData {
  username?: string;
  world?: string;
}

@Injectable()
export class UsersRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>
  ) {}

  // ==================== CREATE OPERATIONS ====================

  async createUser(userData: CreateUserData): Promise<SmartRotomUser> {
    try {
      await this.db.insert(smartrotomUsers).values({
        uuid: userData.uuid,
        username: userData.username,
        world: userData.world
      } as SmartRotomUser).execute();

      const newUser = await this.findUserByUuid(userData.uuid);
      if (!newUser) {
        throw new Error('Failed to retrieve created user');
      }

      return newUser;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw new Error(`User creation failed: ${error.message}`);
    }
  }

  // ==================== READ OPERATIONS ====================

  async findAllUsers(): Promise<SmartRotomUser[]> {
    try {
      return await this.db.select().from(smartrotomUsers).execute();
    } catch (error) {
      console.error('Failed to retrieve all users:', error);
      throw new Error(`Failed to retrieve users: ${error.message}`);
    }
  }

  async findUserByUuid(uuid: string): Promise<SmartRotomUser | null> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('UUID is required');
    }

    try {
      const rows = await this.db
        .select()
        .from(smartrotomUsers)
        .where(eq(smartrotomUsers.uuid, uuid))
        .execute();

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`Failed to find user by UUID ${uuid}:`, error);
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  async findUserById(id: number): Promise<SmartRotomUser | null> {
    if (!id || id <= 0) {
      throw new Error('Valid ID is required');
    }

    try {
      const rows = await this.db
        .select()
        .from(smartrotomUsers)
        .where(eq(smartrotomUsers.id, id))
        .execute();

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`Failed to find user by ID ${id}:`, error);
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  async checkUserExists(uuid: string): Promise<boolean> {
    try {
      const user = await this.findUserByUuid(uuid);
      return !!user;
    } catch (error) {
      console.error(`Failed to check if user exists ${uuid}:`, error);
      return false;
    }
  }

  // ==================== UPDATE OPERATIONS ====================

  async updateUser(id: number, updateData: UpdateUserData): Promise<SmartRotomUser> {
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
        .update(smartrotomUsers)
        .set(updateData)
        .where(eq(smartrotomUsers.id, id))
        .execute();

      // Return updated user
      const updatedUser = await this.findUserById(id);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      return updatedUser;
    } catch (error) {
      console.error(`Failed to update user ${id}:`, error);
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
        .delete(smartrotomUsers)
        .where(eq(smartrotomUsers.id, id))
        .execute();

      return true;
    } catch (error) {
      console.error(`Failed to delete user ${id}:`, error);
      throw new Error(`User deletion failed: ${error.message}`);
    }
  }

  // ==================== BATCH OPERATIONS ====================

  async findUsersByUuids(uuids: string[]): Promise<{ [uuid: string]: SmartRotomUser | null }> {
    if (!Array.isArray(uuids) || uuids.length === 0) {
      return {};
    }

    const results: { [uuid: string]: SmartRotomUser | null } = {};

    try {
      // Process in batches to avoid potential query size limits
      const batchSize = 50;
      for (let i = 0; i < uuids.length; i += batchSize) {
        const batch = uuids.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (uuid) => {
          try {
            const user = await this.findUserByUuid(uuid);
            return { uuid, user };
          } catch (error) {
            console.error(`Failed to find user ${uuid}:`, error);
            return { uuid, user: null };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach(({ uuid, user }) => {
          results[uuid] = user;
        });
      }

      return results;
    } catch (error) {
      console.error('Failed to find users by UUIDs:', error);
      throw new Error(`Batch user retrieval failed: ${error.message}`);
    }
  }

  // ==================== STATISTICS ====================

  async getUserCount(): Promise<number> {
    try {
      const users = await this.findAllUsers();
      return users.length;
    } catch (error) {
      console.error('Failed to get user count:', error);
      return 0;
    }
  }

  async getUsersCreatedAfter(date: Date): Promise<SmartRotomUser[]> {
    try {
      // Assuming there's a createdAt field in the schema
      // If not available, this would need to be adjusted
      const users = await this.findAllUsers();
      return users.filter(user => {
        // This would need actual createdAt field comparison
        return true; // Placeholder
      });
    } catch (error) {
      console.error('Failed to get users created after date:', error);
      return [];
    }
  }
}