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

export interface ScreenshotResponse {
  success: boolean;
  image?: string;  // Data URL (data:image/png;base64,...)
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
  const result = await mcefQuery<{status: string, data: string}>('TAKE_SCREENSHOT', {
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

  const data  = result.data as {status: string, data: string};


  return {
    success: true,
    image: data.data  // Data URL from Java
  };
}