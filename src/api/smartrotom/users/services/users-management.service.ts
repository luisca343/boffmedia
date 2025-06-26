import { Injectable } from '@nestjs/common';
import { UsersRepository, CreateUserData, UpdateUserData } from '@api/smartrotom/users/repositories/users.repository';
import { SmartRotomUser } from '@/_db/schema/SmartRotom';

export interface UserCreationResult {
  user: SmartRotomUser;
  isNew: boolean;
}

export interface UserValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable()
export class UsersManagementService {
  constructor(
    private readonly usersRepository: UsersRepository,
  ) {}

  async createUser(userData: CreateUserData): Promise<SmartRotomUser> {
    // Validate input
    const validation = this.validateUserData(userData);
    if (!validation.isValid) {
      throw new Error(`Invalid user data: ${validation.errors.join(', ')}`);
    }

    try {
      // Check if user already exists
      const existingUser = await this.usersRepository.findUserByUuid(userData.uuid);
      if (existingUser) {
        console.log(`User ${userData.uuid} already exists, returning existing user`);
        return existingUser;
      }

      console.log('Creating new user:', userData);
      return await this.usersRepository.createUser(userData);
    } catch (error) {
      console.error('Failed to create user:', error);
      throw new Error(`User creation failed: ${error.message}`);
    }
  }

  async findOrCreateUser(userData: CreateUserData): Promise<UserCreationResult> {
    try {
      let user = await this.usersRepository.findUserByUuid(userData.uuid);
      let isNew = false;

      if (!user) {
        user = await this.createUser(userData);
        isNew = true;
      }

      return { user, isNew };
    } catch (error) {
      console.error('Failed to find or create user:', error);
      throw new Error(`Find or create user failed: ${error.message}`);
    }
  }

  async getAllUsers(): Promise<SmartRotomUser[]> {
    try {
      return await this.usersRepository.findAllUsers();
    } catch (error) {
      console.error('Failed to get all users:', error);
      throw new Error(`Failed to retrieve users: ${error.message}`);
    }
  }

  async getUserByUuid(uuid: string): Promise<SmartRotomUser | null> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('UUID is required');
    }

    try {
      return await this.usersRepository.findUserByUuid(uuid);
    } catch (error) {
      console.error(`Failed to get user by UUID ${uuid}:`, error);
      throw new Error(`Failed to retrieve user: ${error.message}`);
    }
  }

  async getUserById(id: number): Promise<SmartRotomUser | null> {
    if (!id || id <= 0) {
      throw new Error('Valid ID is required');
    }

    try {
      return await this.usersRepository.findUserById(id);
    } catch (error) {
      console.error(`Failed to get user by ID ${id}:`, error);
      throw new Error(`Failed to retrieve user: ${error.message}`);
    }
  }

  async updateUser(id: number, updateData: UpdateUserData): Promise<SmartRotomUser> {
    // Validate update data
    if (updateData.username && !this.isValidUsername(updateData.username)) {
      throw new Error('Invalid username format');
    }

    try {
      return await this.usersRepository.updateUser(id, updateData);
    } catch (error) {
      console.error(`Failed to update user ${id}:`, error);
      throw new Error(`User update failed: ${error.message}`);
    }
  }

  async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const success = await this.usersRepository.deleteUser(id);
      return {
        success,
        message: success ? 'User deleted successfully' : 'Failed to delete user'
      };
    } catch (error) {
      console.error(`Failed to delete user ${id}:`, error);
      return {
        success: false,
        message: `User deletion failed: ${error.message}`
      };
    }
  }

  async getUserCount(): Promise<number> {
    try {
      return await this.usersRepository.getUserCount();
    } catch (error) {
      console.error('Failed to get user count:', error);
      return 0;
    }
  }

  async getMultipleUsers(uuids: string[]): Promise<{ [uuid: string]: SmartRotomUser | null }> {
    if (!Array.isArray(uuids) || uuids.length === 0) {
      return {};
    }

    try {
      return await this.usersRepository.findUsersByUuids(uuids);
    } catch (error) {
      console.error('Failed to get multiple users:', error);
      throw new Error(`Multiple users retrieval failed: ${error.message}`);
    }
  }

  // ==================== VALIDATION METHODS ====================

  private validateUserData(userData: CreateUserData): UserValidationResult {
    const errors: string[] = [];

    if (!userData.uuid || userData.uuid.trim() === '') {
      errors.push('UUID is required');
    }

    if (!userData.username || userData.username.trim() === '') {
      errors.push('Username is required');
    }

    if (userData.username && !this.isValidUsername(userData.username)) {
      errors.push('Username format is invalid');
    }

    if (userData.uuid && !this.isValidUuid(userData.uuid)) {
      errors.push('UUID format is invalid');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isValidUsername(username: string): boolean {
    // Basic username validation - adjust as needed
    return /^[a-zA-Z0-9_-]{3,16}$/.test(username);
  }

  private isValidUuid(uuid: string): boolean {
    // Basic UUID validation - adjust as needed
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
  }
}