import { rotomGET, rotomPOST, rotomPATCH, rotomDELETE, ApiResponse } from '@/services/boffAPI';
import type { SmartRotomApp, SuccessResponse, CreateAppDto, UpdateAppDto, OrderAppDto } from '@/generated/api';

export const appsService = {
  /**
   * Get all apps
   */
  findAll: (): Promise<ApiResponse<SmartRotomApp[]>> => 
    rotomGET<SmartRotomApp[]>('/apps'),

  /**
   * Create a new app
   */
  create: (createAppDto: CreateAppDto): Promise<ApiResponse<SmartRotomApp>> => 
    rotomPOST<SmartRotomApp>('/apps', createAppDto),

  /**
   * Order apps for a player
   */
  order: (orderAppDto: OrderAppDto): Promise<ApiResponse<SuccessResponse>> => 
    rotomPOST<SuccessResponse>('/apps/order', orderAppDto),

  /**
   * Get apps for a specific player
   */
  getForPlayer: (uuid: string): Promise<ApiResponse<SmartRotomApp[]>> => 
    rotomPOST<SmartRotomApp[]>('/apps/player', { uuid }),

  /**
   * Add an app to a player
   */
  addAppToPlayer: (uuid: string, id: number): Promise<ApiResponse<SuccessResponse>> => 
    rotomPOST<SuccessResponse>('/apps/player/add', { uuid, id }),

  /**
   * Remove an app from a player
   */
  removeAppFromPlayer: (uuid: string, id: number): Promise<ApiResponse<SuccessResponse>> => 
    rotomPOST<SuccessResponse>('/apps/player/remove', { uuid, id }),

  /**
   * Get a single app by ID
   */
  findOne: (id: number): Promise<ApiResponse<SmartRotomApp>> => 
    rotomGET<SmartRotomApp>(`/apps/${id}`),

  /**
   * Update an app
   */
  update: (id: number, updateAppDto: UpdateAppDto): Promise<ApiResponse<SmartRotomApp>> => 
    rotomPATCH<SmartRotomApp>(`/apps/${id}`, updateAppDto),

  /**
   * Delete an app
   */
  remove: (id: number): Promise<ApiResponse<SuccessResponse>> => 
    rotomDELETE<SuccessResponse>(`/apps/${id}`),
};

// Export types for convenience
export type { SmartRotomApp, SuccessResponse, CreateAppDto, UpdateAppDto, OrderAppDto, ApiResponse };