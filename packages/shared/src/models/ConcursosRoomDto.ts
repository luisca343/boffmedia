/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConcursosDeviceRecoveryDto } from './ConcursosDeviceRecoveryDto';
import type { ConcursosEntityDto } from './ConcursosEntityDto';
import type { ConcursosGameDto } from './ConcursosGameDto';
import type { ConcursosMemberDto } from './ConcursosMemberDto';
import type { ConcursosRecoverySettingsDto } from './ConcursosRecoverySettingsDto';
export type ConcursosRoomDto = {
    pendingRecoveries?: Array<ConcursosDeviceRecoveryDto>;
    hostConnected: boolean;
    recoverySettings: ConcursosRecoverySettingsDto;
    pacing: ConcursosRoomDto.pacing;
    resultSeconds: number;
    mode: ConcursosRoomDto.mode;
    entities: Array<ConcursosEntityDto>;
    game?: ConcursosGameDto;
    code: string;
    status: ConcursosRoomDto.status;
    members: Array<ConcursosMemberDto>;
    capacity: number;
    role: ConcursosRoomDto.role;
    memberId?: string;
};
export namespace ConcursosRoomDto {
    export enum pacing {
        AUTOMATIC = 'automatic',
        DIRECTED = 'directed',
    }
    export enum mode {
        INDIVIDUAL = 'individual',
        TEAMS = 'teams',
    }
    export enum status {
        LOBBY = 'lobby',
        PLAYING = 'playing',
        CLOSED = 'closed',
    }
    export enum role {
        HOST = 'host',
        PLAYER = 'player',
    }
}

