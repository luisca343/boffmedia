/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ConcursosSocketRequestDto = {
    type: ConcursosSocketRequestDto.type;
    id?: string;
    code?: string;
    token?: string;
    operation?: ConcursosSocketRequestDto.operation;
    body?: Record<string, any>;
};
export namespace ConcursosSocketRequestDto {
    export enum type {
        AUTH = 'auth',
        PING = 'ping',
        COMMAND = 'command',
    }
    export enum operation {
        CONFIGURATION = 'configuration',
        GROUP = 'group',
        START = 'start',
        ACTION = 'action',
        LEAVE = 'leave',
        CLOSE = 'close',
    }
}

