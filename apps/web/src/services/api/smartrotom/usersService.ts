import {
  rotomGET,
  rotomAuthedDELETE,
  ApiResponse,
  rotomAuthedPATCH,
  rotomAuthedPOST,
} from "@/services/boffAPI";
import type { 
  RotomUser as SmartRotomUser,
  CreateSmartrotomUserDto,
  UpdateSmartrotomUserDto,
  UserInitializationDataDto,
  InitializationResult,
  UserWithAccounts,
  FindOrCreateResult,
  UserStatistics,
  UserValidationResult
} from '@boffmedia/shared';

export class UsersService {
  /**
   * Get all users
   */
  static findAll(): Promise<ApiResponse<SmartRotomUser[]>> {
    return rotomGET<SmartRotomUser[]>('/users');
  }

  /**
   * Create a new user
   */
  static create(createUserDto: CreateSmartrotomUserDto): Promise<ApiResponse<SmartRotomUser>> {
    return rotomAuthedPOST<SmartRotomUser>('/users', createUserDto);
  }

  /**
   * Get a single user by ID
   */
  static findOne(id: number): Promise<ApiResponse<SmartRotomUser>> {
    return rotomGET<SmartRotomUser>(`/users/${id}`);
  }

  /**
   * Get a user by UUID
   */
  static findByUuid(uuid: string): Promise<ApiResponse<SmartRotomUser>> {
    return rotomGET<SmartRotomUser>(`/users/uuid/${uuid}`);
  }

  /**
   * Update a user
   */
  static update(id: number, updateUserDto: UpdateSmartrotomUserDto): Promise<ApiResponse<SmartRotomUser>> {
    return rotomAuthedPATCH<SmartRotomUser>(`/users/${id}`, updateUserDto);
  }

  /**
   * Delete a user
   */
  static remove(id: number): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return rotomAuthedDELETE<{ success: boolean; message: string }>(`/users/${id}`);
  }

  /**
   * Find or create a user
   */
  static findOrCreate(createUserDto: CreateSmartrotomUserDto): Promise<ApiResponse<FindOrCreateResult>> {
    return rotomAuthedPOST<FindOrCreateResult>('/users/find-or-create', createUserDto);
  }

  /**
   * Initialize user and accounts
   */
  static initialize(data: UserInitializationDataDto): Promise<ApiResponse<InitializationResult>> {
    return rotomAuthedPOST<InitializationResult>('/users/initialize', data);
  }

  /**
   * Get user with their accounts
   */
  static getUserWithAccounts(uuid: string): Promise<ApiResponse<UserWithAccounts>> {
    return rotomGET<UserWithAccounts>(`/users/${uuid}/accounts`);
  }

  /**
   * Get multiple users by UUIDs
   */
  static getMultipleUsers(uuids: string[]): Promise<ApiResponse<{ [uuid: string]: SmartRotomUser | null }>> {
    return rotomAuthedPOST<{ [uuid: string]: SmartRotomUser | null }>('/users/batch', { uuids });
  }

  /**
   * Get multiple users with their accounts
   */
  static getMultipleUsersWithAccounts(uuids: string[]): Promise<ApiResponse<{ [uuid: string]: UserWithAccounts | null }>> {
    return rotomAuthedPOST<{ [uuid: string]: UserWithAccounts | null }>('/users/batch/accounts', { uuids });
  }

  /**
   * Get user statistics overview
   */
  static getStatistics(): Promise<ApiResponse<UserStatistics>> {
    return rotomGET<UserStatistics>('/users/stats/overview');
  }

  /**
   * Validate if user exists
   */
  static validateUser(uuid: string): Promise<ApiResponse<UserValidationResult>> {
    return rotomGET<UserValidationResult>(`/users/validate/${uuid}`);
  }
}