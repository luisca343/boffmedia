/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConcursosEntityDto } from './ConcursosEntityDto';
import type { ConcursosGameDto } from './ConcursosGameDto';
import type { ConcursosMemberDto } from './ConcursosMemberDto';
export type ConcursosRoomDto = {
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

