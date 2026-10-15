/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConcursosDeviceRecoveryDto } from './ConcursosDeviceRecoveryDto';
import type { ConcursosRoomDto } from './ConcursosRoomDto';
export type ConcursosSocketResponseDto = {
    type: ConcursosSocketResponseDto.type;
    id?: string;
    data?: ConcursosRoomDto;
    recovery?: ConcursosDeviceRecoveryDto;
    statusCode?: number;
    code?: string;
    userMessage?: string;
};
export namespace ConcursosSocketResponseDto {
    export enum type {
        READY = 'ready',
        SNAPSHOT = 'snapshot',
        REPLY = 'reply',
        ERROR = 'error',
        PONG = 'pong',
    }
}

