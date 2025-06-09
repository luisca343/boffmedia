import { Injectable } from '@nestjs/common';
import { UsersManagementService, UserCreationResult } from './services/users-management.service';
import { StarbankService } from '../starbank/starbank.service';
import { SmartRotomUser } from '@/_db/schema/SmartRotom';
import { CreateUserData, UpdateUserData } from '@repositories/smartrotom/users.repository';

export interface UserInitializationData {
  uuid: string;
  username: string;
  world?: string;
}

export interface InitializationResult {
  user: SmartRotomUser;
  accounts: any[];
  isNewUser: boolean;
  isNewAccount: boolean;
}

export interface UserWithAccounts {
  user: SmartRotomUser;
  accounts: any[];
}

@Injectable()
export class UsersFacadeService {
  constructor(
    private readonly usersManagementService: UsersManagementService,
    private readonly starbankService: StarbankService,
  ) {}

  // ==================== USER OPERATIONS ====================

  async createUser(userData: CreateUserData): Promise<SmartRotomUser> {
    try {
      return await this.usersManagementService.createUser(userData);
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async findOrCreateUser(userData: CreateUserData): Promise<UserCreationResult> {
    try {
      return await this.usersManagementService.findOrCreateUser(userData);
    } catch (error) {
      console.error('Error finding or creating user:', error);
      throw new Error(`Failed to find or create user: ${error.message}`);
    }
  }

  async getAllUsers(): Promise<SmartRotomUser[]> {
    try {
      return await this.usersManagementService.getAllUsers();
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error(`Failed to retrieve users: ${error.message}`);
    }
  }

  async getUserByUuid(uuid: string): Promise<SmartRotomUser | null> {
    try {
      return await this.usersManagementService.getUserByUuid(uuid);
    } catch (error) {
      console.error(`Error getting user by UUID ${uuid}:`, error);
      throw new Error(`Failed to retrieve user: ${error.message}`);
    }
  }

  async getUserById(id: number): Promise<SmartRotomUser | null> {
    try {
      return await this.usersManagementService.getUserById(id);
    } catch (error) {
      console.error(`Error getting user by ID ${id}:`, error);
      throw new Error(`Failed to retrieve user: ${error.message}`);
    }
  }

  async updateUser(id: number, updateData: UpdateUserData): Promise<SmartRotomUser> {
    try {
      return await this.usersManagementService.updateUser(id, updateData);
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    try {
      return await this.usersManagementService.deleteUser(id);
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      return {
        success: false,
        message: `Failed to delete user: ${error.message}`
      };
    }
  }

  // ==================== INTEGRATED OPERATIONS ====================

  async initializeUserAndAccounts(data: UserInitializationData): Promise<InitializationResult> {
    try {
      console.log('Initializing user and accounts for:', data);

      // Find or create user
      const userResult = await this.usersManagementService.findOrCreateUser({
        uuid: data.uuid,
        username: data.username,
        world: data.world
      });

      // Check existing accounts
      let accounts = await this.starbankService.getAccounts(data.uuid);
      let isNewAccount = false;

      // Create main account if none exist
      if (accounts.length === 0) {
        console.log('No accounts found, creating main account');
        await this.starbankService.createMainAccount(data.uuid, data.username);
        accounts = await this.starbankService.getAccounts(data.uuid);
        isNewAccount = true;
      }

      return {
        user: userResult.user,
        accounts,
        isNewUser: userResult.isNew,
        isNewAccount
      };
    } catch (error) {
      console.error('Error initializing user and accounts:', error);
      throw new Error(`Initialization failed: ${error.message}`);
    }
  }

  async getUserWithAccounts(uuid: string): Promise<UserWithAccounts | null> {
    try {
      const user = await this.usersManagementService.getUserByUuid(uuid);
      if (!user) {
        return null;
      }

      const accounts = await this.starbankService.getAccounts(uuid);

      return {
        user,
        accounts
      };
    } catch (error) {
      console.error(`Error getting user with accounts for ${uuid}:`, error);
      throw new Error(`Failed to retrieve user with accounts: ${error.message}`);
    }
  }

  // ==================== BATCH OPERATIONS ====================

  async getMultipleUsers(uuids: string[]): Promise<{ [uuid: string]: SmartRotomUser | null }> {
    try {
      return await this.usersManagementService.getMultipleUsers(uuids);
    } catch (error) {
      console.error('Error getting multiple users:', error);
      throw new Error(`Failed to retrieve multiple users: ${error.message}`);
    }
  }

  async getMultipleUsersWithAccounts(uuids: string[]): Promise<{ [uuid: string]: UserWithAccounts | null }> {
    try {
      const results: { [uuid: string]: UserWithAccounts | null } = {};

      // Process in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < uuids.length; i += batchSize) {
        const batch = uuids.slice(i, i + batchSize);

        const batchPromises = batch.map(async (uuid) => {
          try {
            const userWithAccounts = await this.getUserWithAccounts(uuid);
            return { uuid, result: userWithAccounts };
          } catch (error) {
            console.error(`Failed to get user with accounts for ${uuid}:`, error);
            return { uuid, result: null };
          }
        });

        const batchResults = await Promise.all(batchPromises);

        batchResults.forEach(({ uuid, result }) => {
          results[uuid] = result;
        });
      }

      return results;
    } catch (error) {
      console.error('Error getting multiple users with accounts:', error);
      throw new Error(`Failed to retrieve multiple users with accounts: ${error.message}`);
    }
  }

  // ==================== STATISTICS ====================

  async getUserStatistics(): Promise<{
    totalUsers: number;
    usersWithAccounts: number;
    usersWithoutAccounts: number;
  }> {
    try {
      const totalUsers = await this.usersManagementService.getUserCount();
      
      // This would need more sophisticated querying for accurate counts
      // For now, return basic stats
      return {
        totalUsers,
        usersWithAccounts: 0, // Would need to implement
        usersWithoutAccounts: 0 // Would need to implement
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      return {
        totalUsers: 0,
        usersWithAccounts: 0,
        usersWithoutAccounts: 0
      };
    }
  }

  // ==================== VALIDATION ====================

  async validateUserExists(uuid: string): Promise<boolean> {
    try {
      const user = await this.usersManagementService.getUserByUuid(uuid);
      return !!user;
    } catch (error) {
      console.error(`Error validating user exists ${uuid}:`, error);
      return false;
    }
  }
}