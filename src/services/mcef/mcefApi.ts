import { PossibleSpawn } from '@/app/smartrotom/pokedex/_components/PossibleSpawns';
import { QueryResult, mcefQuery } from './mcefHelper';
import { getSpawnsPlaceholder } from './mcefPlaceholders';
import { CallData } from '@/components/smartrotom/calls/CallStatus';

export async function getMcUserData(): Promise<QueryResult<{ username: string; uuid: string; world: string }>> {
    const result = await mcefQuery<{ username: string; uuid: string; world: string }>('GET_USER_DATA');
    if (result.error) {
        console.error('Error fetching user data:', result.error);
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
        return { data: getSpawnsPlaceholder, status: 200 };
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