/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type BattlesimTicketDto = {
    /**
     * Short-lived JWT ticket for WebSocket authentication
     */
    ticket: string;
    /**
     * Ticket expiration time in seconds
     */
    expiresIn: number;
};

