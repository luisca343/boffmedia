import { PossibleSpawn } from '@/app/smartrotom/pokedex/_components/PossibleSpawns';
import { QueryResult, mcefQuery } from './mcefHelper';
import { getSpawnsPlaceholder } from './mcefPlaceholders';
import { CallData } from '@/components/smartrotom/types/call';

export async function getMcUserData(): Promise<QueryResult<{ username: string; uuid: string; world: string, x: number, y: number, z: number }>> {
    const result = await mcefQuery<{ username: string; uuid: string; world: string, x: number, y: number, z: number }>('GET_USER_DATA');
    if (result.error) {
        console.error('Error fetching user data:', result.error);
        return { data: { username: '', uuid: '', world: '', x: 0, y: 0, z: 0 }, status: 500 };
    } else {
        console.log('getDatosUsuarioMC', result.data);
    }
    return result;
}

export async function openPC(): Promise<void> {
    const result = await mcefQuery<void>('OPEN_PC', {});
    if (result.error) {
        console.error('Error in openPC:', result.error);
        throw new Error(result.error);
    }
}

export async function getSpawns(): Promise<QueryResult<PossibleSpawn[]>> {
    const result = await mcefQuery<PossibleSpawn[]>('GET_SPAWNS');
    if (result.error) {
        return { data: getSpawnsPlaceholder, status: 200 } as QueryResult<PossibleSpawn[]>;
    } 
    
    return result;
}

export async function setCall(callData: CallData): Promise<QueryResult<any>> {
    const result = await mcefQuery<any>('SET_CALL', {...callData});
    if (result.error) {
        console.error('Error setting call:', result.error);
    }
    return result;
}

export async function leaveCall(callData: CallData): Promise<QueryResult<any>> {
    const result = await mcefQuery<any>('LEAVE_CALL', {...callData});
    if (result.error) {
        console.error('Error leaving call:', result.error);
    }
    return result;
}

export async function sendChatMessage(message: string): Promise<QueryResult<any>> {
    const result = await mcefQuery<any>('CHAT_MESSAGE', { message });
    if (result.error) {
        console.error('Error sending chat message:', result.error);
    }
    return result;
}

export async function taxiTeleport(destination: { id: string }): Promise<QueryResult<any>> {
    const result = await mcefQuery<any>('TAXI_TELEPORT', destination);
    if (result.error) {
        console.error('Error teleporting via taxi:', result.error);
    }
    return result;
}

type ObjetoMC = {
    id: string;
    cantidad: number;
}

export async function darCaja(objetos: ObjetoMC[]): Promise<QueryResult<any>> {
    const result = await mcefQuery<any>('DAR_CAJA', { objetos });
    if (result.error) {
        console.error('Error giving box:', result.error);
    }
    return result;
}

export interface ScreenshotOptions {
  includeUI?: boolean;      // Include Minecraft HUD/UI elements
  format?: 'png' | 'jpeg';  // Image format
  quality?: number;         // JPEG quality (1-100), ignored for PNG
}

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface BlockInfo {
  x: number;
  y: number;
  z: number;
  block: string;
}

export interface LocationData {
  playerPosition: Position;
  lookingAt?: BlockInfo;
}

export interface PokemonEntity {
  type: 'pokemon';
  species: string;
  dex: number;
  form: string;
  palette: string;
  distance: number;
  coverage: number;
  position: Position;
}

export interface StatueEntity {
  type: 'statue';
  species: string;
  dex: number;
  distance: number;
  coverage: number;
  position: Position;
}

export interface NPCEntity {
  type: 'npc';
  name: string;
  distance: number;
  coverage: number;
  position: Position;
}

export interface OtherEntity {
  type: 'other';
  name: string;
  distance: number;
  coverage: number;
  position: Position;
}

export type DetectedEntity = PokemonEntity | StatueEntity | OtherEntity | NPCEntity;

export interface ScreenshotResponse {
  success: boolean;
  image?: string;  // Data URL (data:image/png;base64,...)
  location?: LocationData;
  entities?: DetectedEntity[];
  error?: string;
}

/**
 * Captures a screenshot of the Minecraft game window
 * @param options Screenshot options
 * @returns Promise with the screenshot as a base64 data URL
 */
export async function takeScreenshot(
  options: ScreenshotOptions = {}
): Promise<ScreenshotResponse> {
  const result = await mcefQuery<{
    image: string;
    location: LocationData;
    entities: DetectedEntity[];
  }>('TAKE_SCREENSHOT', {
    includeUI: options.includeUI ?? true,
    format: options.format ?? 'png',
    quality: options.quality ?? 90
  });

  if (result.error) {
    return {
      success: false,
      error: result.error
    };
  }

  const data = result.data  as ScreenshotResponse


  return {
    success: true,
    image: data.image,
    location: data.location,
    entities: data.entities
  } as ScreenshotResponse
}

export interface ZoomLevelResponse {
  success: boolean;
  level?: number;
  multiplier?: number;
  factor?: number;
  error?: string;
}

/**
 * Gets the current zoom level from Minecraft
 * @returns Promise with the current zoom level (0-4)
 */
export async function getZoomLevel(): Promise<ZoomLevelResponse> {
  const result = await mcefQuery<{
    level: number;
    multiplier: number;
    factor: number;
  }>('GET_ZOOM_LEVEL');

  if (result.error) {
    return {
      success: false,
      error: result.error
    };
  }

  return {
    success: true,
    level: result.data?.level,
    multiplier: result.data?.multiplier,
    factor: result.data?.factor
  };
}

export interface Waypoint {
  name: string;
  x: number;
  y: number;
  z: number;
  color?: string;
  dimension?: string;
}

export interface WaypointsResponse {
  success: boolean;
  waypoints?: Waypoint[];
  error?: string;
}

/**
 * Gets all waypoints from Xaero's Minimap/Worldmap
 * @returns Promise with the list of waypoints
 */
export async function getWaypoints(): Promise<WaypointsResponse> {
  const result = await mcefQuery<{
    status: string;
    waypoints: Waypoint[];
  }>('GET_WAYPOINTS');

  if (result.error) {
    return {
      success: false,
      error: result.error
    };
  }

  return {
    success: true,
    waypoints: result.data?.waypoints || []
  };
}

export interface AddWaypointParams {
  name?: string;
  x: number;
  y: number;
  z: number;
  color?: string;
}

export interface AddWaypointResponse {
  success: boolean;
  error?: string;
}

/**
 * Adds a new waypoint to Xaero's Minimap/Worldmap
 * @param params Waypoint parameters (name, x, y, z, color)
 * @returns Promise indicating success or failure
 */
export async function addWaypoint(params: AddWaypointParams): Promise<AddWaypointResponse> {
  const result = await mcefQuery<{
    status: string;
  }>('ADD_WAYPOINT', {
    name: params.name || 'waypoint',
    x: params.x,
    y: params.y,
    z: params.z,
    color: params.color || '#FFFFFF'
  });

  if (result.error) {
    return {
      success: false,
      error: result.error
    };
  }

  return {
    success: true
  };
}

/**
 * Sets the zoom level in Minecraft
 * @param level Zoom level (0-4): 0 = 1x, 1 = 1.5x, 2 = 2x, 3 = 3x, 4 = 4x
 * @returns Promise with the new zoom level
 */
export async function setZoomLevel(level: number): Promise<ZoomLevelResponse> {
  const result = await mcefQuery<{
    level: number;
    multiplier: number;
    factor: number;
  }>('SET_ZOOM_LEVEL', { level });

  if (result.error) {
    return {
      success: false,
      error: result.error
    };
  }

  return {
    success: true,
    level: result.data?.level,
    multiplier: result.data?.multiplier,
    factor: result.data?.factor
  };
}