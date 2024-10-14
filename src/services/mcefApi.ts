import { PossibleSpawn } from '@/app/smartrotom/pokedex/_components/PossibleSpawns';
import { QueryResult, mcefQuery } from './mcefHelper';
import { getSpawnsPlaceholder } from './mcefPlaceholders';
import { CallData } from '@/components/smartrotom/CallStatus';
import { SmartRotomResponse } from '@/types';

export async function getMcUserData(): Promise<QueryResult<{ username: string; uuid: string; world: string }>> {
    const result = await mcefQuery<{ username: string; uuid: string; world: string }>('getUserData');
    if (result.error) {
        console.error('Error fetching user data:', result.error);
    } else {
        console.log('getDatosUsuarioMC', result.data);
    }
    return result;
}

export async function openPC(): Promise<void> {
    const result = await mcefQuery<void>('openPC', {});
    if (result.error) {
        console.error('Error in openPC:', result.error);
        throw new Error(result.error);
    }
}

export async function getSpawns(): Promise<QueryResult<PossibleSpawn[]>> {
    const result = await mcefQuery<PossibleSpawn[]>('getSpawns');
    if (result.error) {
        return { data: getSpawnsPlaceholder, status: 200 };
    } 
    
    return result;
}

export async function setCall(callData: CallData): Promise<QueryResult<SmartRotomResponse>> {
    const result = await mcefQuery<SmartRotomResponse>('setCall', {...callData});
    if (result.error) {
        console.error('Error setting call:', result.error);
    }
    return result;
}

export async function leaveCall(callData: CallData): Promise<QueryResult<SmartRotomResponse>> {
    const result = await mcefQuery<SmartRotomResponse>('leaveCall', {...callData});
    if (result.error) {
        console.error('Error leaving call:', result.error);
    }
    return result;
}