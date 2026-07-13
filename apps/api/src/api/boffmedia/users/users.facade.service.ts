import { Injectable } from '@nestjs/common';
import {
  BoffMediaUsersManagementService,
  UserCreationResult,
  SessionUser,
  GoogleUserData,
  DiscordUserData,
  TwitchUserData,
  MinecraftRegistrationData,
  MinecraftLinkData,
} from './services/users-management.service';
import { UsersFacadeService as SmartRotomUsersFacadeService } from '@api/smartrotom/users/users.facade.service';
import { StarbankFacadeService } from '@api/smartrotom/starbank/starbank.facade.service';
import { BoffMediaUser } from '@/_db/schema/BoffMedia';
import { SmartRotomUser } from '@/_db/schema/SmartRotom';
import {
  BoffMediaUserSafe,
  FullUserData,
  FullUserDataSafe,
} from './repositories/interfaces/users.repository.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Logger } from 'nestjs-pino';

export interface BoffMediaUserInitializationData {
  email: string;
  username: string;
  password: string;
  minecraft?: {
    username: string;
    uuid: string;
    world: string;
  };
  google?: {
    googleId: string;
    profilePicture?: string;
  };
}

export interface IntegratedUserCreationResult {
  boffMediaUser: BoffMediaUserSafe;
  smartRotomUser: SmartRotomUser | null;
  starbankAccounts: any[];
  isNewBoffMediaUser: boolean;
  isNewSmartRotomUser: boolean;
}

export interface UserWithIntegrations {
  boffMediaUser: BoffMediaUserSafe;
  smartRotomUser: SmartRotomUser | null;
  starbankAccounts: any[];
  roles: string[];
}

export interface AuthenticationResult {
  sessionUser: SessionUser;
  integrations: {
    hasSmartRotom: boolean;
    hasStarbank: boolean;
    rolesCount: number;
  };
}

@Injectable()
export class BoffMediaUsersFacadeService {
  constructor(
    private readonly logger: Logger,

    private readonly usersManagementService: BoffMediaUsersManagementService,
    private readonly smartRotomUsersFacadeService: SmartRotomUsersFacadeService,
    private readonly starbankService: StarbankFacadeService,
  ) {}

  // ==================== USER CREATION & INITIALIZATION ====================

  async createUser(userData: CreateUserDto): Promise<BoffMediaUserSafe> {
    try {
      return await this.usersManagementService.createUser(userData);
    } catch (error: any) {
      this.logger.error('Failed to create BoffMedia user:', error);
      throw new Error(`BoffMedia user creation failed: ${error.message}`);
    }
  }

  async findOrCreateUser(userData: CreateUserDto): Promise<UserCreationResult> {
    try {
      return await this.usersManagementService.findOrCreateUser(userData);
    } catch (error: any) {
      this.logger.error('Failed to find or create BoffMedia user:', error);
      throw new Error(`BoffMedia user find/create failed: ${error.message}`);
    }
  }

  async initializeFullUser(
    data: BoffMediaUserInitializationData,
  ): Promise<IntegratedUserCreationResult> {
    try {
      this.logger.log('Initializing full user with integrations:', {
        username: data.username,
        email: data.email,
      });

      let smartRotomUser: SmartRotomUser | null = null;
      let isNewSmartRotomUser = false;
      let starbankAccounts: any[] = [];

      if (data.minecraft) {
        try {
          const smartRotomResult =
            await this.smartRotomUsersFacadeService.initializeUserAndAccounts({
              uuid: data.minecraft.uuid,
              username: data.minecraft.username,
              world: data.minecraft.world,
            });

          smartRotomUser = smartRotomResult.user;
          isNewSmartRotomUser = smartRotomResult.isNewUser;
          starbankAccounts = smartRotomResult.accounts;

          this.logger.log('SmartRotom integration completed:', {
            uuid: smartRotomUser.uuid,
            isNew: isNewSmartRotomUser,
            accountsCount: starbankAccounts.length,
          });
        } catch (error: any) {
          this.logger.error(
            'SmartRotom integration failed, continuing without it:',
            error,
          );
        }
      }

      const boffMediaUserData: CreateUserDto = {
        email: data.email,
        username: data.username,
        password: data.password,
        uuid: data.minecraft?.uuid,
        googleId: data.google?.googleId,
        profilePicture: data.google?.profilePicture,
      };

      const boffMediaResult = await this.findOrCreateUser(boffMediaUserData);

      return {
        boffMediaUser: boffMediaResult.user,
        smartRotomUser,
        starbankAccounts,
        isNewBoffMediaUser: boffMediaResult.isNew,
        isNewSmartRotomUser,
      };
    } catch (error: any) {
      this.logger.error('Failed to initialize full user:', error);
      throw new Error(`User initialization failed: ${error.message}`);
    }
  }

  // ==================== USER RETRIEVAL ====================

  async getAllUsers(): Promise<BoffMediaUserSafe[]> {
    try {
      return await this.usersManagementService.getAllUsers();
    } catch (error: any) {
      this.logger.error('Failed to get all BoffMedia users:', error);
      throw new Error(`Failed to retrieve users: ${error.message}`);
    }
  }

  async getUserById(id: number): Promise<BoffMediaUserSafe | null> {
    try {
      return await this.usersManagementService.getUserById(id);
    } catch (error: any) {
      this.logger.error(`Failed to get BoffMedia user by ID ${id}:`, error);
      throw new Error(`Failed to retrieve user: ${error.message}`);
    }
  }

  async getUserByUsername(username: string): Promise<BoffMediaUserSafe | null> {
    try {
      return await this.usersManagementService.getUserByUsername(username);
    } catch (error: any) {
      this.logger.error(
        `Failed to get BoffMedia user by username ${username}:`,
        error,
      );
      throw new Error(`Failed to retrieve user: ${error.message}`);
    }
  }

  async getUserByEmail(email: string): Promise<BoffMediaUserSafe | null> {
    try {
      return await this.usersManagementService.getUserByEmail(email);
    } catch (error: any) {
      this.logger.error(
        `Failed to get BoffMedia user by email ${email}:`,
        error,
      );
      throw new Error(`Failed to retrieve user: ${error.message}`);
    }
  }

  // ==================== INTEGRATED USER RETRIEVAL ====================

  async getUserWithIntegrations(
    identifier: string,
    type: 'id' | 'username' | 'email' | 'uuid',
  ): Promise<UserWithIntegrations | null> {
    try {
      let fullUser: FullUserDataSafe | null = null;

      switch (type) {
        case 'id':
          const user = await this.getUserById(parseInt(identifier));
          if (user) {
            fullUser = await this.usersManagementService.getFullUserByUsername(
              user.username,
            );
          }
          break;
        case 'username':
          fullUser =
            await this.usersManagementService.getFullUserByUsername(identifier);
          break;
        case 'email':
          fullUser =
            await this.usersManagementService.getFullUserByEmail(identifier);
          break;
        case 'uuid':
          fullUser =
            await this.usersManagementService.getFullUserByUuid(identifier);
          break;
      }

      if (!fullUser) {
        return null;
      }

      // Get user roles
      const roles = await this.usersManagementService.getUserRoles(
        fullUser.boffmedia_users.id,
      );

      // Get Starbank accounts if SmartRotom user exists
      let starbankAccounts: any[] = [];
      if (fullUser.rotom_users) {
        try {
          const userWithAccounts =
            await this.smartRotomUsersFacadeService.getUserWithAccounts(
              fullUser.rotom_users.uuid,
            );
          starbankAccounts = userWithAccounts?.accounts || [];
        } catch (error: any) {
          this.logger.error('Failed to get Starbank accounts:', error);
        }
      }

      return {
        boffMediaUser: fullUser.boffmedia_users,
        smartRotomUser: fullUser.rotom_users,
        starbankAccounts,
        roles,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to get user with integrations ${identifier}:`,
        error,
      );
      throw new Error(`Failed to retrieve integrated user: ${error.message}`);
    }
  }

  async getFullUserByUsername(
    username: string,
  ): Promise<FullUserDataSafe | null> {
    try {
      return await this.usersManagementService.getFullUserByUsername(username);
    } catch (error: any) {
      this.logger.error(
        `Failed to get full user by username ${username}:`,
        error,
      );
      throw new Error(`Failed to retrieve full user: ${error.message}`);
    }
  }

  async getFullUserByEmail(email: string): Promise<FullUserDataSafe | null> {
    try {
      return await this.usersManagementService.getFullUserByEmail(email);
    } catch (error: any) {
      this.logger.error(`Failed to get full user by email ${email}:`, error);
      throw new Error(`Failed to retrieve full user: ${error.message}`);
    }
  }

  // ==================== USER UPDATE ====================

  async updateUser(
    id: number,
    updateData: UpdateUserDto,
  ): Promise<BoffMediaUserSafe> {
    try {
      return await this.usersManagementService.updateUser(id, updateData);
    } catch (error: any) {
      this.logger.error(`Failed to update BoffMedia user ${id}:`, error);
      throw new Error(`User update failed: ${error.message}`);
    }
  }

  async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    return await this.usersManagementService.changePassword(
      id,
      currentPassword,
      newPassword,
    );
  }

  async unlinkProvider(
    id: number,
    provider: 'google' | 'discord' | 'twitch' | 'steam',
  ): Promise<BoffMediaUserSafe> {
    try {
      return await this.usersManagementService.unlinkProvider(id, provider);
    } catch (error: any) {
      this.logger.error(
        `Failed to unlink ${provider} for BoffMedia user ${id}:`,
        error,
      );
      throw new Error(`Provider unlink failed: ${error.message}`);
    }
  }

  async linkSteam(id: number, steamId: string): Promise<BoffMediaUserSafe> {
    try {
      return await this.usersManagementService.linkSteam(id, steamId);
    } catch (error: any) {
      this.logger.error(
        `Failed to link Steam for BoffMedia user ${id}:`,
        error,
      );
      throw error;
    }
  }

  async linkDiscord(id: number, discordId: string): Promise<BoffMediaUserSafe> {
    try {
      return await this.usersManagementService.linkDiscord(id, discordId);
    } catch (error: any) {
      this.logger.error(
        `Failed to link Discord for BoffMedia user ${id}:`,
        error,
      );
      throw error;
    }
  }

  async linkGoogle(id: number, googleId: string): Promise<BoffMediaUserSafe> {
    try {
      return await this.usersManagementService.linkGoogle(id, googleId);
    } catch (error: any) {
      this.logger.error(
        `Failed to link Google for BoffMedia user ${id}:`,
        error,
      );
      throw error;
    }
  }

  async linkTwitch(id: number, twitchId: string): Promise<BoffMediaUserSafe> {
    try {
      return await this.usersManagementService.linkTwitch(id, twitchId);
    } catch (error: any) {
      this.logger.error(
        `Failed to link Twitch for BoffMedia user ${id}:`,
        error,
      );
      throw error;
    }
  }

  // ==================== USER DELETION ====================

  async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    try {
      return await this.usersManagementService.deleteUser(id);
    } catch (error: any) {
      this.logger.error(`Failed to delete BoffMedia user ${id}:`, error);
      return {
        success: false,
        message: `User deletion failed: ${error.message}`,
      };
    }
  }

  // ==================== AUTHENTICATION ====================

  async validateUser(
    username: string,
    password: string,
  ): Promise<AuthenticationResult | null> {
    try {
      const sessionUser = await this.usersManagementService.validateUser(
        username,
        password,
      );

      if (!sessionUser) {
        return null;
      }

      // Get user integrations info
      const userWithIntegrations = await this.getUserWithIntegrations(
        username,
        'username',
      );

      return {
        sessionUser,
        integrations: {
          hasSmartRotom: !!userWithIntegrations?.smartRotomUser,
          hasStarbank:
            (userWithIntegrations?.starbankAccounts?.length || 0) > 0,
          rolesCount: userWithIntegrations?.roles?.length || 0,
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to validate user ${username}:`, error);
      return null;
    }
  }

  async findByEmail(email: string): Promise<SessionUser | null> {
    try {
      const fullUser =
        await this.usersManagementService.getFullUserByEmail(email);
      if (!fullUser) {
        return null;
      }

      return {
        id: fullUser.boffmedia_users.id,
        name: fullUser.boffmedia_users.username,
        email: fullUser.boffmedia_users.email,
        roles: [],
        smartRotomUser: fullUser.rotom_users
          ? {
              username: fullUser.rotom_users.username,
              uuid: fullUser.rotom_users.uuid,
              world: fullUser.rotom_users.world || '',
            }
          : null,
      };
    } catch (error: any) {
      this.logger.error(`Failed to find user by email ${email}:`, error);
      return null;
    }
  }

  // ==================== GOOGLE AUTHENTICATION ====================

  async createFromGoogle(googleUser: GoogleUserData): Promise<SessionUser> {
    try {
      return await this.usersManagementService.createFromGoogle(googleUser);
    } catch (error: any) {
      this.logger.error('Failed to create user from Google:', error);
      throw new Error(`Google authentication failed: ${error.message}`);
    }
  }

  async createFromDiscord(discordUser: DiscordUserData): Promise<SessionUser> {
    try {
      return await this.usersManagementService.createFromDiscord(discordUser);
    } catch (error: any) {
      this.logger.error('Failed to create user from Discord:', error);
      throw new Error(`Discord authentication failed: ${error.message}`);
    }
  }

  async createFromTwitch(twitchUser: TwitchUserData): Promise<SessionUser> {
    try {
      return await this.usersManagementService.createFromTwitch(twitchUser);
    } catch (error: any) {
      this.logger.error('Failed to create user from Twitch:', error);
      throw new Error(`Twitch authentication failed: ${error.message}`);
    }
  }

  // ==================== MINECRAFT INTEGRATION ====================

  async createMinecraftUser(
    registerData: MinecraftRegistrationData,
  ): Promise<IntegratedUserCreationResult> {
    try {
      this.logger.log('Creating integrated Minecraft user:', {
        username: registerData.username,
        mcUsername: registerData.minecraft.username,
        uuid: registerData.minecraft.uuid,
      });

      // Initialize full user with Minecraft integration
      const result = await this.initializeFullUser({
        email: registerData.email,
        username: registerData.username,
        password: registerData.password,
        minecraft: registerData.minecraft,
      });

      this.logger.log('Minecraft user creation completed:', {
        boffMediaUserId: result.boffMediaUser.id,
        smartRotomUserId: result.smartRotomUser?.id,
        hasStarbank: result.starbankAccounts.length > 0,
      });

      return result;
    } catch (error: any) {
      this.logger.error('Failed to create Minecraft user:', error);
      throw new Error(`Minecraft user creation failed: ${error.message}`);
    }
  }

  async linkMinecraftAccount(linkData: MinecraftLinkData): Promise<{
    boffMediaUser: BoffMediaUserSafe;
    smartRotomUser: SmartRotomUser;
    starbankAccounts: any[];
  }> {
    try {
      this.logger.log('Linking Minecraft account:', {
        username: linkData.username,
        mcUuid: linkData.minecraft.uuid,
      });

      // Validate user credentials first
      const sessionUser = await this.usersManagementService.validateUser(
        linkData.username,
        linkData.password,
      );
      if (!sessionUser) {
        throw new Error('Invalid credentials');
      }

      // Create/find SmartRotom user FIRST (this creates the UUID in rotom_users table)
      const smartRotomResult =
        await this.smartRotomUsersFacadeService.initializeUserAndAccounts({
          uuid: linkData.minecraft.uuid,
          username: linkData.minecraft.username,
          world: linkData.minecraft.world,
        });

      // Now update BoffMedia user with UUID (the UUID exists in rotom_users now)
      const boffMediaUser =
        await this.usersManagementService.linkMinecraftAccount(linkData);

      this.logger.log('Minecraft account linking completed:', {
        boffMediaUserId: boffMediaUser.id,
        smartRotomUserId: smartRotomResult.user.id,
        accountsCount: smartRotomResult.accounts.length,
      });

      return {
        boffMediaUser,
        smartRotomUser: smartRotomResult.user,
        starbankAccounts: smartRotomResult.accounts,
      };
    } catch (error: any) {
      this.logger.error('Failed to link Minecraft account:', error);
      throw new Error(`Minecraft account linking failed: ${error.message}`);
    }
  }

  // ==================== ROLES MANAGEMENT ====================

  async getUserRoles(userId: number): Promise<string[]> {
    try {
      return await this.usersManagementService.getUserRoles(userId);
    } catch (error: any) {
      this.logger.error(`Failed to get user roles for ${userId}:`, error);
      throw new Error(`Failed to get user roles: ${error.message}`);
    }
  }

  // ==================== BATCH OPERATIONS ====================

  async getMultipleUsersWithIntegrations(
    userIds: number[],
  ): Promise<{ [id: number]: UserWithIntegrations | null }> {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return {};
    }

    const results: { [id: number]: UserWithIntegrations | null } = {};

    try {
      // Process users in parallel
      const promises = userIds.map(async (id) => {
        try {
          const userWithIntegrations = await this.getUserWithIntegrations(
            id.toString(),
            'id',
          );
          results[id] = userWithIntegrations;
        } catch (error: any) {
          this.logger.error(
            `Failed to get user with integrations for ID ${id}:`,
            error,
          );
          results[id] = null;
        }
      });

      await Promise.all(promises);
      return results;
    } catch (error: any) {
      this.logger.error(
        'Failed to get multiple users with integrations:',
        error,
      );
      throw new Error(`Batch user retrieval failed: ${error.message}`);
    }
  }

  // ==================== STATISTICS ====================

  async getUserStatistics(): Promise<{
    totalBoffMediaUsers: number;
    usersWithSmartRotom: number;
    usersWithStarbank: number;
    usersWithRoles: number;
  }> {
    try {
      const allUsers = await this.getAllUsers();
      const totalBoffMediaUsers = allUsers.length;

      let usersWithSmartRotom = 0;
      let usersWithStarbank = 0;
      let usersWithRoles = 0;

      // Count integrations for each user
      const promises = allUsers.map(async (user) => {
        try {
          const userWithIntegrations = await this.getUserWithIntegrations(
            user.id.toString(),
            'id',
          );
          if (userWithIntegrations) {
            if (userWithIntegrations.smartRotomUser) usersWithSmartRotom++;
            if (userWithIntegrations.starbankAccounts.length > 0)
              usersWithStarbank++;
            if (userWithIntegrations.roles.length > 0) usersWithRoles++;
          }
        } catch (error: any) {
          this.logger.error(
            `Failed to get statistics for user ${user.id}:`,
            error,
          );
        }
      });

      await Promise.all(promises);

      return {
        totalBoffMediaUsers,
        usersWithSmartRotom,
        usersWithStarbank,
        usersWithRoles,
      };
    } catch (error: any) {
      this.logger.error('Failed to get user statistics:', error);
      return {
        totalBoffMediaUsers: 0,
        usersWithSmartRotom: 0,
        usersWithStarbank: 0,
        usersWithRoles: 0,
      };
    }
  }

  async getUserCount(): Promise<number> {
    try {
      return await this.usersManagementService.getUserCount();
    } catch (error: any) {
      this.logger.error('Failed to get user count:', error);
      return 0;
    }
  }

  // ==================== VALIDATION ====================

  async validateUserExists(
    identifier: string,
    type: 'id' | 'username' | 'email' | 'uuid',
  ): Promise<boolean> {
    try {
      const user = await this.getUserWithIntegrations(identifier, type);
      return !!user;
    } catch (error: any) {
      this.logger.error(`Failed to validate user exists ${identifier}:`, error);
      return false;
    }
  }

  // ==================== LEGACY METHODS (for backward compatibility) ====================

  async getSessionUser(fullUser: FullUserData): Promise<SessionUser> {
    return {
      id: fullUser.boffmedia_users.id,
      name: fullUser.boffmedia_users.username,
      email: fullUser.boffmedia_users.email,
      roles: [],
      smartRotomUser: fullUser.rotom_users
        ? {
            username: fullUser.rotom_users.username,
            uuid: fullUser.rotom_users.uuid,
            world: fullUser.rotom_users.world || '',
          }
        : null,
    };
  }

  // Support for the original createFromBoffMedia method
  async createFromBoffMedia(
    boffMediaUser: Partial<BoffMediaUser>,
  ): Promise<BoffMediaUserSafe> {
    if (
      !boffMediaUser.email ||
      !boffMediaUser.username ||
      !boffMediaUser.password
    ) {
      throw new Error('Email, username, and password are required');
    }

    const userData: CreateUserDto = {
      email: boffMediaUser.email,
      username: boffMediaUser.username,
      password: boffMediaUser.password,
      uuid: boffMediaUser.uuid ?? undefined,
      profilePicture: boffMediaUser.profilePicture,
      googleId: boffMediaUser.googleId ?? undefined,
      discordId: boffMediaUser.discordId ?? undefined,
    };

    return await this.createUser(userData);
  }
}
