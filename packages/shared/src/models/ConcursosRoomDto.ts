/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConcursosMemberDto } from './ConcursosMemberDto';
export type ConcursosRoomDto = {
    code: string;
    status: ConcursosRoomDto.status;
    members: Array<ConcursosMemberDto>;
    capacity: number;
    role: ConcursosRoomDto.role;
    memberId?: string;
};
export namespace ConcursosRoomDto {
    export enum status {
        LOBBY = 'lobby',
        CLOSED = 'closed',
    }
    export enum role {
        HOST = 'host',
        PLAYER = 'player',
    }
}

