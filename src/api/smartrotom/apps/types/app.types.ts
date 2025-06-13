// ==================== BASE TYPES ====================
export interface BaseSmartRotomApp {
  id: number;
  name: string;
  url: string | null;
  active: number;
}

// ==================== REQUEST TYPES ====================
export interface CreateAppRequest {
  name: string;
  url?: string;
  active?: number;
}

export interface UpdateAppRequest {
  name?: string;
  description?: string;
  url?: string;
  icon?: string;
}

export interface OrderAppsRequest {
  newOrder: { id: number; order: number }[];
  uuid: string;
}

export interface PlayerAppsRequest {
  uuid: string;
}

export interface PlayerAppRequest {
  uuid: string;
  id: number;
}

// ==================== RESPONSE TYPES ====================
export interface AppResponse extends BaseSmartRotomApp {}

export interface PlayerAppResponse {
  id: number;
  url: string;
  name: string;
  orden: number;
  is_user_app: number;
}