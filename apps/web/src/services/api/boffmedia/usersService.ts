import {
  AuthenticationResultEntity, BatchUsersDto, BoffMediaUserEntity, CreateUserDto, FullUserEntity,
  GoogleAuthDto, IntegratedUserCreationResultEntity, UserLoginDto,
  MinecraftLinkDto, MinecraftRegistrationDto,
  SessionUserEntity, SuccessResponse, UpdateUserDto, UserStatistics, UserValidationResponseEntity,
  UserRolesResponseEntity, UsersPaginatedResponseEntity, UserWithIntegrationsEntity,
} from '@boffmedia/shared';
import {
  apiGET,
  apiPOST,
  apiAuthedPOST,
  apiAuthedAutoGET,
  apiAuthedAutoPOST,
  apiAuthedAutoPATCH,
  apiAuthedAutoDELETE,
} from '@/services/boffAPI';

export type { GoogleAuthDto, UserLoginDto, MinecraftLinkDto, MinecraftRegistrationDto };

export type BatchUsersRequest = BatchUsersDto;
export type UsersPaginatedResponse = UsersPaginatedResponseEntity;
export type UserRolesResponse = UserRolesResponseEntity;
export type UserValidationResponse = UserValidationResponseEntity;

export class UsersService {
  // ==================== USER CREATION ====================

  /**
   * Create a new BoffMedia user
   */
  static createUser(data: CreateUserDto) {
    return apiPOST<BoffMediaUserEntity>('/users', data);
  }

  /**
   * Register a new user with Minecraft integration
   */
  static registerMinecraftUser(data: MinecraftRegistrationDto) {
    return apiPOST<IntegratedUserCreationResultEntity>('/users/minecraft/register', data);
  }

  /**
   * Link existing user to Minecraft account
   */
  static linkMinecraftAccount(data: MinecraftLinkDto) {
    return apiPOST<UserWithIntegrationsEntity>('/users/minecraft/link', data);
  }

  /**
   * Authenticate or create user via Google OAuth
   */
  static googleAuth(data: GoogleAuthDto) {
    return apiPOST<SessionUserEntity>('/users/google/auth', data);
  }

  // ==================== USER RETRIEVAL ====================

  /**
   * Get all BoffMedia users with optional pagination
   */
  static getUsers(limit?: number, offset?: number) {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append('limit', limit.toString());
    if (offset !== undefined) params.append('offset', offset.toString());
    
    const queryString = params.toString();
    const url = queryString ? `/users?${queryString}` : '/users';

    return apiAuthedAutoGET<UsersPaginatedResponseEntity>(url);
  }

  /**
   * Get user statistics with integrations
   */
  static getStatistics() {
    return apiAuthedAutoGET<UserStatistics>('/users/statistics');
  }

  /**
   * Get user by ID
   */
  static getUser(id: number) {
    return apiAuthedAutoGET<BoffMediaUserEntity>(`/users/${id}`);
  }

  /**
   * Get user with all integrations (SmartRotom, Starbank, Roles)
   */
  static getUserWithIntegrations(id: number) {
    return apiAuthedAutoGET<UserWithIntegrationsEntity>(`/users/${id}/integrations`);
  }

  /**
   * Get user by username (admin-only on the API)
   */
  static getUserByUsername(username: string) {
    return apiAuthedAutoGET<BoffMediaUserEntity>(`/users/username/${username}`);
  }

  /**
   * Get full user data by username (with SmartRotom data) — admin-only on the API
   */
  static getFullUserByUsername(username: string) {
    return apiAuthedAutoGET<FullUserEntity>(`/users/username/${username}/full`);
  }

  /**
   * Get user by email (admin-only on the API)
   */
  static getUserByEmail(email: string) {
    return apiAuthedAutoGET<SessionUserEntity>(`/users/email/${email}`);
  }

  /**
   * Get user roles
   */
  static getUserRoles(id: number) {
    return apiAuthedAutoGET<UserRolesResponseEntity>(`/users/${id}/roles`);
  }

  // ==================== USER UPDATE ====================

  /**
   * Update user by ID
   */
  static updateUser(id: number, data: UpdateUserDto) {
    return apiAuthedAutoPATCH<BoffMediaUserEntity>(`/users/${id}`, data);
  }

  /**
   * Unlink a provider (google/discord/twitch/steam) from a user.
   */
  static unlinkProvider(id: number, provider: 'google' | 'discord' | 'twitch' | 'steam') {
    return apiAuthedAutoDELETE<BoffMediaUserEntity>(`/users/${id}/link/${provider}`);
  }

  /**
   * Link a verified SteamID64 to a user. Called server-side from the Steam
   * OpenID callback, so the caller passes the session's API token explicitly.
   */
  static linkSteam(id: number, steamId: string, token: string) {
    return apiAuthedPOST<BoffMediaUserEntity>(`/users/${id}/link/steam`, { steamId }, token);
  }

  /**
   * Link a verified Discord id to a user. Called server-side from the Discord
   * OAuth link callback, so the caller passes the session's API token explicitly.
   */
  static linkDiscord(id: number, discordId: string, token: string) {
    return apiAuthedPOST<BoffMediaUserEntity>(`/users/${id}/link/discord`, { discordId }, token);
  }

  /**
   * Link a verified Google id (`sub`) to a user. Called server-side from the
   * Google OAuth link callback, so the caller passes the session token explicitly.
   */
  static linkGoogle(id: number, googleId: string, token: string) {
    return apiAuthedPOST<BoffMediaUserEntity>(`/users/${id}/link/google`, { googleId }, token);
  }

  /**
   * Link a verified Twitch id to a user. Called server-side from the Twitch
   * OAuth link callback, so the caller passes the session token explicitly.
   */
  static linkTwitch(id: number, twitchId: string, token: string) {
    return apiAuthedPOST<BoffMediaUserEntity>(`/users/${id}/link/twitch`, { twitchId }, token);
  }

  // ==================== USER DELETION ====================

  /**
   * Delete user by ID
   */
  static deleteUser(id: number) {
    return apiAuthedAutoDELETE<SuccessResponse>(`/users/${id}`);
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Authenticate user with username and password
   */
  static login(data: UserLoginDto) {
    return apiPOST<AuthenticationResultEntity>('/users/auth/login', data);
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * Get multiple users with integrations by IDs
   */
  static getBatchUsersWithIntegrations(data: BatchUsersDto) {
    return apiAuthedAutoPOST<UserWithIntegrationsEntity[]>('/users/batch', data);
  }

  // ==================== VALIDATION ====================

  /**
   * Validate if user exists by different identifiers
   */
  static validateUserExists(type: 'id' | 'username' | 'email' | 'uuid', identifier: string) {
    return apiGET<UserValidationResponseEntity>(`/users/validate/${type}/${identifier}`);
  }

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Get user with roles
   */
  static async getUserWithRoles(id: number) {
    const [user, rolesResponse] = await Promise.all([
      UsersService.getUser(id),
      UsersService.getUserRoles(id)
    ]);
    return { 
      user: user.data, 
      roles: rolesResponse.data?.roles || []
    };
  }

  /**
   * Get complete user profile
   */
  static async getCompleteUserProfile(id: number) {
    const [user, integrations, roles] = await Promise.all([
      UsersService.getUser(id),
      UsersService.getUserWithIntegrations(id),
      UsersService.getUserRoles(id)
    ]);
    return { 
      user: user.data,
      integrations: integrations.data,
      roles: roles.data?.roles || []
    };
  }

  /**
   * Search users by partial username
   */
  static searchUsersByUsername(partialUsername: string, limit: number = 10) {
    return UsersService.getUsers(limit).then(response => {
      if (response.data?.users) {
        const filteredUsers = response.data.users.filter(user =>
          user.username.toLowerCase().includes(partialUsername.toLowerCase())
        );
        return {
          ...response,
          data: {
            ...response.data,
            users: filteredUsers,
            total: filteredUsers.length
          }
        };
      }
      return response;
    });
  }

  /**
   * Check if username is available
   */
  static async isUsernameAvailable(username: string) {
    try {
      const response = await UsersService.validateUserExists('username', username);
      return !response.data?.exists;
    } catch (error) {
      return true; // If validation fails, assume available
    }
  }

  /**
   * Check if email is available
   */
  static async isEmailAvailable(email: string) {
    try {
      const response = await UsersService.validateUserExists('email', email);
      return !response.data?.exists;
    } catch (error) {
      return true; // If validation fails, assume available
    }
  }

  /**
   * Get users with pagination and search
   */
  static async getUsersWithSearch(options: {
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    const response = await UsersService.getUsers(options.limit, options.offset);
    
    if (options.search && response.data?.users) {
      const searchTerm = options.search.toLowerCase();
      const filteredUsers = response.data.users.filter(user =>
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
      
      return {
        ...response,
        data: {
          ...response.data,
          users: filteredUsers,
          total: filteredUsers.length,
          filtered: true,
          searchTerm: options.search
        }
      };
    }
    
    return response;
  }
}