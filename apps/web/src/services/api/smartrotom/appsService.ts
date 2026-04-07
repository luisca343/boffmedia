import { rotomGET, rotomPOST, rotomPATCH, rotomDELETE, ApiResponse } from '@/services/boffAPI';
import type { SmartRotomApp, SuccessResponse, CreateAppDto, UpdateAppDto, OrderAppDto } from '@boffmedia/shared';

export class AppsService {
  /**
   * Get all apps
   */
  static findAll(): Promise<ApiResponse<SmartRotomApp[]>> {
    return rotomGET<SmartRotomApp[]>('/apps');
  }

  /**
   * Create a new app
   */
  static create(createAppDto: CreateAppDto): Promise<ApiResponse<SmartRotomApp>> {
    return rotomPOST<SmartRotomApp>('/apps', createAppDto);
  }

  /**
   * Order apps for a player
   */
  static order(orderAppDto: OrderAppDto): Promise<ApiResponse<SuccessResponse>> {
    return rotomPOST<SuccessResponse>('/apps/order', orderAppDto);
  }

  /**
   * Get apps for a specific player
   */
  static getForPlayer(uuid: string): Promise<ApiResponse<SmartRotomApp[]>> {
    return rotomPOST<SmartRotomApp[]>('/apps/player', { uuid });
  }

  /**
   * Add an app to a player
   */
  static addAppToPlayer(uuid: string, id: number): Promise<ApiResponse<SuccessResponse>> {
    return rotomPOST<SuccessResponse>('/apps/player/add', { uuid, id });
  }

  /**
   * Remove an app from a player
   */
  static removeAppFromPlayer(uuid: string, id: number): Promise<ApiResponse<SuccessResponse>> {
    return rotomPOST<SuccessResponse>('/apps/player/remove', { uuid, id });
  }

  /**
   * Get a single app by ID
   */
  static findOne(id: number): Promise<ApiResponse<SmartRotomApp>> {
    return rotomGET<SmartRotomApp>(`/apps/${id}`);
  }

  /**
   * Update an app
   */
  static update(id: number, updateAppDto: UpdateAppDto): Promise<ApiResponse<SmartRotomApp>> {
    return rotomPATCH<SmartRotomApp>(`/apps/${id}`, updateAppDto);
  }

  /**
   * Delete an app
   */
  static remove(id: number): Promise<ApiResponse<SuccessResponse>> {
    return rotomDELETE<SuccessResponse>(`/apps/${id}`);
  }
}