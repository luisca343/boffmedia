import { AuthenticationResultEntity, BoffMediaUserEntity, CreateUserDto, FullUserEntity, IntegratedUserCreationResultEntity, SessionUserEntity, SuccessResponse, UpdateUserDto, UserStatistics, UserWithIntegrationsEntity } from '@boffmedia/shared';
import { apiGET, apiPOST, apiPUT, apiDELETE, apiPATCH } from '@/services/boffAPI';

// Additional DTOs for specialized endpoints
export interface MinecraftRegistrationDto {
  username: string;
  email: string;
  password: string;
  minecraft: {
    username: string;
    uuid: string;
    world: string;
  };
}

export interface MinecraftLinkDto {
  username: string;
  email: string;
  password: string;
  minecraft: {
    username: string;
    uuid: string;
    world: string;
  };
}

export interface GoogleAuthDto {
  email: string;
  name: string;
  googleId: string;
  profilePicture?: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface BatchUsersRequest {
  userIds: number[];
}

export interface UsersPaginatedResponse {
  users: BoffMediaUserEntity[];
  total: number;
  limit?: number;
  offset?: number;
}

export interface UserRolesResponse {
  roles: string[];
}

export interface UserValidationResponse {
  exists: boolean;
  type: string;
  identifier: string;
}

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
    
    return apiGET<UsersPaginatedResponse>(url);
  }

  /**
   * Get user statistics with integrations
   */
  static getStatistics() {
    return apiGET<UserStatistics>('/users/statistics');
  }

  /**
   * Get user by ID
   */
  static getUser(id: number) {
    return apiGET<BoffMediaUserEntity>(`/users/${id}`);
  }

  /**
   * Get user with all integrations (SmartRotom, Starbank, Roles)
   */
  static getUserWithIntegrations(id: number) {
    return apiGET<UserWithIntegrationsEntity>(`/users/${id}/integrations`);
  }

  /**
   * Get user by username
   */
  static getUserByUsername(username: string) {
    return apiGET<BoffMediaUserEntity>(`/users/username/${username}`);
  }

  /**
   * Get full user data by username (with SmartRotom data)
   */
  static getFullUserByUsername(username: string) {
    return apiGET<FullUserEntity>(`/users/username/${username}/full`);
  }

  /**
   * Get user by email
   */
  static getUserByEmail(email: string) {
    return apiGET<SessionUserEntity>(`/users/email/${email}`);
  }

  /**
   * Get user roles
   */
  static getUserRoles(id: number) {
    return apiGET<UserRolesResponse>(`/users/${id}/roles`);
  }

  // ==================== USER UPDATE ====================

  /**
   * Update user by ID
   */
  static updateUser(id: number, data: UpdateUserDto) {
    return apiPATCH<BoffMediaUserEntity>(`/users/${id}`, data);
  }

  // ==================== USER DELETION ====================

  /**
   * Delete user by ID
   */
  static deleteUser(id: number) {
    return apiDELETE<SuccessResponse>(`/users/${id}`);
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Authenticate user with username and password
   */
  static login(data: LoginDto) {
    return apiPOST<AuthenticationResultEntity>('/users/auth/login', data);
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * Get multiple users with integrations by IDs
   */
  static getBatchUsersWithIntegrations(data: BatchUsersRequest) {
    return apiPOST<UserWithIntegrationsEntity[]>('/users/batch', data);
  }

  // ==================== VALIDATION ====================

  /**
   * Validate if user exists by different identifiers
   */
  static validateUserExists(type: 'id' | 'username' | 'email' | 'uuid', identifier: string) {
    return apiGET<UserValidationResponse>(`/users/validate/${type}/${identifier}`);
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