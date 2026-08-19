import {
  rotomAuthedGET,
  rotomAuthedPOST,
  rotomAuthedPATCH,
  rotomAuthedDELETE,
  ApiResponse,
} from '@/services/boffAPI';

// Every call carries the session Bearer: the registry writes are admin-gated and
// the `player/*` routes take the owner from the token instead of the body.
import type { RotomApp as SmartRotomApp, SuccessResponse, CreateAppDto, UpdateAppDto, OrderAppDto } from '@boffmedia/shared';

export class AppsService {
  /**
   * Get all apps
   */
  static findAll(): Promise<ApiResponse<SmartRotomApp[]>> {
    return rotomAuthedGET<SmartRotomApp[]>('/apps');
  }

  /**
   * Create a new app
   */
  static create(createAppDto: CreateAppDto): Promise<ApiResponse<SmartRotomApp>> {
    return rotomAuthedPOST<SmartRotomApp>('/apps', createAppDto);
  }

  /**
   * Order apps for a player
   */
  static order(orderAppDto: OrderAppDto): Promise<ApiResponse<SuccessResponse>> {
    return rotomAuthedPOST<SuccessResponse>('/apps/order', orderAppDto);
  }

  /**
   * Get apps for a specific player
   */
  static getForPlayer(): Promise<ApiResponse<SmartRotomApp[]>> {
    return rotomAuthedPOST<SmartRotomApp[]>('/apps/player', {});
  }

  /**
   * Add an app to a player
   */
  static addAppToPlayer(id: number): Promise<ApiResponse<SuccessResponse>> {
    return rotomAuthedPOST<SuccessResponse>('/apps/player/add', { id });
  }

  /**
   * Remove an app from a player
   */
  static removeAppFromPlayer(id: number): Promise<ApiResponse<SuccessResponse>> {
    return rotomAuthedPOST<SuccessResponse>('/apps/player/remove', { id });
  }

  /**
   * Get a single app by ID
   */
  static findOne(id: number): Promise<ApiResponse<SmartRotomApp>> {
    return rotomAuthedGET<SmartRotomApp>(`/apps/${id}`);
  }

  /**
   * Update an app
   */
  static update(id: number, updateAppDto: UpdateAppDto): Promise<ApiResponse<SmartRotomApp>> {
    return rotomAuthedPATCH<SmartRotomApp>(`/apps/${id}`, updateAppDto);
  }

  /**
   * Delete an app
   */
  static remove(id: number): Promise<ApiResponse<SuccessResponse>> {
    return rotomAuthedDELETE<SuccessResponse>(`/apps/${id}`);
  }
}