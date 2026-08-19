import {
  rotomAuthedDELETE,
  rotomAuthedGET,
  rotomAuthedPATCH,
  rotomAuthedPOST,
  ApiResponse,
} from "@/services/boffAPI";
import type {
  RotomUser as SmartRotomUser,
  CreateSmartrotomUserDto,
  UpdateSmartrotomUserDto,
  UserWithAccounts,
  UserStatistics,
  UserValidationResult,
} from '@boffmedia/shared';
export class UsersService {
  /**
   * Get all users
   */
  static findAll(): Promise<ApiResponse<SmartRotomUser[]>> {
    return rotomAuthedGET<SmartRotomUser[]>('/users');
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
    return rotomAuthedGET<SmartRotomUser>(`/users/${id}`);
  }

  /**
   * Get a user by UUID
   */
  static findByUuid(uuid: string): Promise<ApiResponse<SmartRotomUser>> {
    return rotomAuthedGET<SmartRotomUser>(`/users/uuid/${uuid}`);
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
   * Get user with their accounts
   */
  static getUserWithAccounts(uuid: string): Promise<ApiResponse<UserWithAccounts>> {
    return rotomAuthedGET<UserWithAccounts>(`/users/${uuid}/accounts`);
  }

  /**
   * Get user statistics overview
   */
  static getStatistics(): Promise<ApiResponse<UserStatistics>> {
    return rotomAuthedGET<UserStatistics>('/users/stats/overview');
  }

  /**
   * Validate if user exists
   */
  static validateUser(uuid: string): Promise<ApiResponse<UserValidationResult>> {
    return rotomAuthedGET<UserValidationResult>(`/users/validate/${uuid}`);
  }
}